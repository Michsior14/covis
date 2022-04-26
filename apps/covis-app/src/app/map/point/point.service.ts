import { Injectable } from '@angular/core';
import { Location } from '@covis/shared';
import { Group, Tween } from '@tweenjs/tween.js';
import { Position } from 'geojson';
import { Observable } from 'rxjs';
import { THREE } from 'threebox-plugin';
import { PausableTimer } from '../../shared/timer';
import { ThreeboxService } from '../threebox.service';
import { VisualizationRepository } from '../visualization/visualization.repository';
import { MaterialHelper } from './material';
import { Point } from './point';
import {
  NormalStrategy,
  RandomStrategy,
  StrategyType,
  Strategy,
} from './point.strategy';

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
  #strategy: Strategy = new NormalStrategy();

  constructor(
    private readonly threeboxService: ThreeboxService,
    private readonly visualizationRepository: VisualizationRepository
  ) {}

  /**
   * Sets the coordinates strategy for the points.
   * @param strategy
   */
  public setStrategy(strategy: StrategyType): void {
    switch (strategy) {
      case StrategyType.random:
        this.#strategy = new RandomStrategy();
        break;
      case StrategyType.normal:
        this.#strategy = new NormalStrategy();
        break;
    }
  }

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
      this.#strategy.reset();
      this.#points.forEach((point) => {
        if (!locations.some((l) => l.personId === point.personId)) {
          this.#points.delete(point.personId);
          this.threeboxService.threebox.remove(point.object);
        }
      });

      let started = 0;
      let finished = 0;
      for (const { location, personId, diseasePhase, hour } of locations) {
        location.coordinates = this.#strategy.coord(location);

        const coords = location.coordinates;
        let point = this.#points.get(personId) as Point;

        if (!point) {
          point = {
            location,
            personId,
            diseasePhase,
            hour,
            object: this.threeboxService.threebox.Object3D({
              obj: new THREE.Points(
                sharedGeometry,
                MaterialHelper.createMaterial(diseasePhase)
              ),
            }),
          };
          point.object.setCoords(coords);
          this.threeboxService.threebox.add(point.object);
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
              this.threeboxService.threebox.utils.lnglatsToWorld([
                point.location.coordinates,
                coords,
              ]);

            new Tween<THREE.Vector3>(start, this.#tweens)
              .to(end, this.visualizationRepository.speed)
              .onUpdate((position) => {
                point.object.position.copy(position);
                const newCoords =
                  this.threeboxService.threebox.utils.unprojectFromWorld(
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
        }, this.visualizationRepository.speed);
      }
    });
  }

  /**
   * It removes all the points from the scene and clears the list of points.
   */
  public reset(): void {
    this.#tweens.removeAll();
    this.#points.forEach((point) =>
      this.threeboxService.threebox.remove(point.object)
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
}
