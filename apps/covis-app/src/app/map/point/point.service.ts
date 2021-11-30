import { Injectable } from '@angular/core';
import { Location } from '@covis/shared';
import { Observable } from 'rxjs';
import { THREE, Threebox } from 'threebox-plugin';

type Object3D = THREE.Object3D & {
  setCoords: (coords: number[]) => void;
};

type Entry = Location & {
  object: Object3D;
};

const sharedGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(),
]);

@Injectable({
  providedIn: 'root',
})
export class PointService {
  #points = new Map<number, Entry>();
  #threebox: typeof Threebox;

  constructor() {}

  public set threebox(threebox: typeof Threebox) {
    this.#threebox = threebox;
  }

  public add(locations: Location[]): Observable<number> {
    return new Observable((observer) => {
      let started = 0;
      for (const { location, personId, diseasePhase, hour } of locations) {
        const point = this.#points.get(personId) ?? {
          location,
          personId,
          diseasePhase,
          hour,
          object: this.#threebox.Object3D({
            obj: new THREE.Points(sharedGeometry, this.createMaterial()),
          }),
        };

        if (!this.#points.has(personId)) {
          point.object.setCoords(location.coordinates.reverse());
          this.#threebox.add(point.object);
          this.#points.set(personId, point);
        } else {
          this.#points.set(personId, {
            ...point,
            location,
            hour,
            diseasePhase,
          });

          started++;
          point.object.followPath(
            {
              path: [
                point.location.coordinates,
                location.coordinates.reverse(),
              ],
              duration: 5000,
              trackHeading: false,
            },
            () => {
              observer.next();
              observer.complete();
            }
          );
        }
      }

      if (started === 0) {
        observer.next();
        observer.complete();
      }
    });
  }

  private createMaterial(
    color: THREE.ColorRepresentation = 0x4fa64f
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
}
