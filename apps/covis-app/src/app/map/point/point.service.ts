import { Injectable } from '@angular/core';
import { Location } from '@covis/shared';
import { Group, Tween } from '@tweenjs/tween.js';
import { Position } from 'geojson';
import { Observable } from 'rxjs';
import { THREE } from 'threebox-plugin';
import { ThreeboxService } from '../threebox.service';
import { MaterialHelper } from './material';
import { Point } from './point';

const sharedGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(),
]);

const animationStep = 5000;

@Injectable({
  providedIn: 'root',
})
export class PointService {
  #tweens = new Group();
  #points = new Map<number, Point>();

  // #coordinates = new Map<string, boolean>();

  constructor(private readonly theeboxService: ThreeboxService) {}

  public animate(locations: Location[]): Observable<void> {
    // this.#coordinates.clear();

    return new Observable((observer) => {
      let started = 0;
      let finished = 0;
      for (const { location, personId, diseasePhase, hour } of locations) {
        const coords = location.coordinates.reverse();
        // const hash = coords.join(',');
        let point = this.#points.get(personId) as Point;

        // point.object.visibility = !this.#coordinates.get(hash);
        // this.#coordinates.set(hash, true);

        if (!point) {
          point = {
            location,
            personId,
            diseasePhase,
            hour,
            object: this.theeboxService.threebox.Object3D({
              obj: new THREE.Points(
                sharedGeometry,
                MaterialHelper.createMaterial(diseasePhase)
              ),
            }),
          };
          point.object.setCoords(coords);
          this.theeboxService.threebox.add(point.object);
          this.#points.set(personId, point);
        } else {
          this.#points.set(personId, {
            ...point,
            location,
            hour,
            diseasePhase,
          });

          const { color } = point.object.model.material.uniforms;
          const newColor = MaterialHelper.getColor(diseasePhase);

          if (!this.equals(point.location.coordinates, coords)) {
            started++;
            // point.object.visibility = true;
            // this.#coordinates.set(hash, false);

            const [start, end] =
              this.theeboxService.threebox.utils.lnglatsToWorld([
                point.location.coordinates,
                coords,
              ]);

            new Tween<THREE.Vector3>(start, this.#tweens)
              .to(end, animationStep)
              .onUpdate((position) => {
                point.object.position.copy(position);
                const newCoords =
                  this.theeboxService.threebox.utils.unprojectFromWorld(
                    position
                  );
                point.object.coordinates = newCoords;
              })
              .start()
              .onComplete(() => {
                finished++;
                color.value = newColor;
                // point.object.visibility = !this.#coordinates.get(hash);
                // this.#coordinates.set(hash, true);
                if (finished === started) {
                  observer.next();
                  observer.complete();
                }
              });
          } else {
            color.value = newColor;
          }
        }
      }

      if (started === 0) {
        setTimeout(() => {
          observer.next();
          observer.complete();
        }, animationStep);
      }
    });
  }

  public reset(): void {
    this.#tweens.removeAll();
    this.#points.forEach((point) =>
      this.theeboxService.threebox.remove(point.object)
    );
    this.#points.clear();
    // this.#coordinates.clear();
  }

  public update(): void {
    this.#tweens.update();
  }

  private equals(a: Position, b: Position): boolean {
    return a[0] === b[0] && a[1] === b[1];
  }
}