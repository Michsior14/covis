import { Injectable } from '@angular/core';
import { DiseasePhase, Location, Stats } from '@covis/shared';
import { Group, Tween } from '@tweenjs/tween.js';
import { Position } from 'geojson';
import { Observable } from 'rxjs';
import { THREE } from 'threebox-plugin';
import { PausableTimer } from '../../shared/timer';
import { LegendRepository } from '../legend/legend.repository';
import { ThreeboxService } from '../threebox.service';
import { VisualizationRepository } from '../visualization/visualization.repository';
import { MaterialHelper } from './material';
import { Point } from './point';

/**
 * The shared geometry for all points.
 */
const sharedGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(),
]);

@Injectable({
  providedIn: 'root',
})
export class PointService {
  #tweens = new Group();
  #points = new Map<number, Point>();

  #paused: Tween<THREE.Vector3>[] = [];
  #timer?: PausableTimer;

  constructor(
    private readonly theeboxService: ThreeboxService,
    private readonly visaulizationRepository: VisualizationRepository,
    private readonly legendRepository: LegendRepository
  ) {}

  /**
   * For each location, create a point object if it doesn't exist, otherwise update the point object
   * with the new location.
   *
   * @param locations
   * @returns An Observable that emits when all the tweens have finished.
   */
  public animate(locations: Location[]): Observable<void> {
    this.#timer = undefined;

    return new Observable((observer) => {
      this.#points.forEach((point) => {
        if (!locations.some((l) => l.personId === point.personId)) {
          this.#points.delete(point.personId);
          this.theeboxService.threebox.remove(point.object);
        }
      });

      let started = 0;
      let finished = 0;
      for (const { location, personId, diseasePhase, hour } of locations) {
        const coords = location.coordinates.reverse();
        let point = this.#points.get(personId) as Point;

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

            const [start, end] =
              this.theeboxService.threebox.utils.lnglatsToWorld([
                point.location.coordinates,
                coords,
              ]);

            new Tween<THREE.Vector3>(start, this.#tweens)
              .to(end, this.visaulizationRepository.speed)
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
        this.#timer = new PausableTimer(() => {
          observer.next();
          observer.complete();
        }, this.visaulizationRepository.speed);
      }

      setTimeout(() => this.updateStats());
    });
  }

  /**
   * It removes all the points from the scene and clears the list of points.
   */
  public reset(): void {
    this.#tweens.removeAll();
    this.#points.forEach((point) =>
      this.theeboxService.threebox.remove(point.object)
    );
    this.#points.clear();
    this.#paused.length = 0;
    this.#timer = undefined;
  }

  /**
   * Pause all tweens.
   */
  public pause(): void {
    if (this.#timer) {
      return this.#timer.pause();
    }

    const toPause = this.#tweens.getAll().slice();
    toPause.forEach((point) => point.pause());
    this.#paused = toPause as Tween<THREE.Vector3>[];
  }

  /**
   * If the timer is running, resume it. If the timer is not running, resume all paused points.
   *
   * @returns The boolean value of whether or not the timer was resumed.
   */
  public resume(): boolean {
    if (this.#timer) {
      this.#timer.resume();
      return true;
    }

    if (this.#paused.length === 0) {
      return false;
    }

    this.#paused.forEach((point) => point.resume());
    this.#paused.length = 0;
    return true;
  }

  /**
   * Update the tweens.
   */
  public update(): void {
    this.#tweens.update();
  }

  /**
   * Check the equality of two coordinates
   *
   * @param a - The first position.
   * @param b - The second position.
   */
  private equals(a: Position, b: Position): boolean {
    return a[0] === b[0] && a[1] === b[1];
  }

  /**
   * Update the disease phase stats.
   */
  private updateStats(): void {
    const stats = Object.values(DiseasePhase).reduce(
      (acc, phase) => ({ ...acc, [phase]: 0 }),
      {} as Required<Stats>
    );

    for (const entry of this.#points) {
      stats[entry[1].diseasePhase]++;
    }

    this.legendRepository.stats = stats;
  }
}
