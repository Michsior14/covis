import { Injectable } from '@angular/core';
import { Location } from '@covis/shared';
import { Position } from 'geojson';
import { Observable } from 'rxjs';
import { THREE, Threebox } from 'threebox-plugin';
import { Group, Tween } from '@tweenjs/tween.js';

type Object3D = THREE.Object3D & {
  setCoords: (coords: number[]) => void;
};

type Entry = Location & {
  object: Object3D;
};

const sharedGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(),
]);

enum DieaseColor {
  sick = 0xcd5c5c,
  healthy = 0x4fa64f,
  susceptible = 0xff670e,
  immunity = 0x4233ff,
  dead = 0x000000,
}

@Injectable({
  providedIn: 'root',
})
export class PointService {
  public tweens = new Group();

  #points = new Map<number, Entry>();
  #coordinates = new Map<string, boolean>();
  #threebox: typeof Threebox;

  constructor() {}

  public set threebox(threebox: typeof Threebox) {
    this.#threebox = threebox;
  }

  public add(locations: Location[]): Observable<number> {
    this.#coordinates.clear();

    return new Observable((observer) => {
      let started = 0;
      let finished = 0;
      for (const { location, personId, diseasePhase, hour } of locations) {
        const coords = location.coordinates.reverse();
        const hash = coords.join(',');
        const point = this.#points.get(personId) ?? {
          location,
          personId,
          diseasePhase,
          hour,
          object: this.#threebox.Object3D({
            obj: new THREE.Points(
              sharedGeometry,
              this.createMaterial(this.getColor(diseasePhase))
            ),
          }),
        };

        point.object.visibility = !this.#coordinates.get(hash);
        this.#coordinates.set(hash, true);

        if (!this.#points.has(personId)) {
          point.object.setCoords(coords);
          this.#threebox.add(point.object);
          this.#points.set(personId, point);
        } else {
          this.#points.set(personId, {
            ...point,
            location,
            hour,
            diseasePhase,
          });

          const newColor = new THREE.Color(this.getColor(diseasePhase));

          if (!this.equals(point.location.coordinates, coords)) {
            started++;
            point.object.visibility = true;
            this.#coordinates.set(hash, false);

            const [start, end] = this.#threebox.utils.lnglatsToWorld([
              point.location.coordinates,
              coords,
            ]);

            new Tween<THREE.Vector3>(start, this.tweens)
              .to(end, 5000)
              .onUpdate((position) => {
                point.object.position.copy(position);
                const newCoords =
                  this.#threebox.utils.unprojectFromWorld(position);
                point.object.coordinates = newCoords;
                point.object.updateMatrixWorld();
              })
              .start()
              .onComplete(() => {
                finished++;
                point.object.model.material.uniforms.color.value = newColor;
                point.object.visibility = !this.#coordinates.get(hash);
                this.#coordinates.set(hash, true);
                if (finished === started) {
                  observer.next();
                  observer.complete();
                }
              });
          } else {
            point.object.model.material.uniforms.color.value = newColor;
          }
        }
      }

      if (started === 0) {
        observer.next();
        observer.complete();
      }
    });
  }

  private createMaterial(
    color: THREE.ColorRepresentation = DieaseColor.healthy
  ): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      vertexShader: `
              uniform float size;

              void main() {
                vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                gl_PointSize = size;
                gl_Position = projectionMatrix * mvPosition;
              }
            `,
      fragmentShader: `
              #ifdef GL_OES_standard_derivatives
              #extension GL_OES_standard_derivatives : enable
              #endif
              uniform vec3 color;

              void main() {
                float alpha = 1.0;
                vec2 cxy = 2.0 * gl_PointCoord - 1.0;
                float r = dot(cxy, cxy);
                #ifdef GL_OES_standard_derivatives
                  float delta = fwidth(r);
                  alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
                #endif
                gl_FragColor = vec4( color, alpha );
              }
            `,
      uniforms: {
        size: { value: 10.0 },
        color: { value: new THREE.Color(color) },
      },
      transparent: true,
    });
  }

  private equals(a: Position, b: Position): boolean {
    return a[0] === b[0] && a[1] === b[1];
  }

  private getColor(diseasePhase: string): number {
    switch (diseasePhase.toLowerCase()) {
      case 'healthy':
        return DieaseColor.healthy;
      case 'susceptible':
        return DieaseColor.susceptible;
      case 'immunity':
        return DieaseColor.immunity;
      case 'dead':
        return DieaseColor.dead;
      default:
        return DieaseColor.sick;
    }
  }
}
