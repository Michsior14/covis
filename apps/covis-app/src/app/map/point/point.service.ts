import { Injectable } from '@angular/core';
import { DiseasePhase, Location } from '@covis/shared';
import { Group, Tween } from '@tweenjs/tween.js';
import { Position } from 'geojson';
import { Observable, Subject } from 'rxjs';
import { THREE } from 'threebox-plugin';
import { PausableTimer } from '../../shared/timer';
import { ThreeboxService } from '../threebox.service';
import { VisualizationRepository } from '../visualization/visualization.repository';
import { MaterialHelper } from './material';
import { Point } from './point';
import {
  NormalStrategy,
  RandomStrategy,
  Strategy,
  StrategyType,
} from './point.strategy';

@Injectable({
  providedIn: 'root',
})
export class PointService {
  #tweens = new Group();
  #points = new Map<number, Point>();

  #paused: Tween<THREE.Vector3>[] = [];
  #timer?: PausableTimer;
  #sharedObject!: Point['object'];
  #strategy: Strategy = new NormalStrategy();
  #needsRepaint = new Subject<void>();

  public needsRepaint = this.#needsRepaint.asObservable();

  constructor(
    private readonly threeboxService: ThreeboxService,
    private readonly visualizationRepository: VisualizationRepository
  ) {}

  /**
   * Initialize the shared threebox objects after the map is created.
   */
  public initialize(): void {
    this.#sharedObject = this.threeboxService.threebox.Object3D({
      obj: new THREE.Points(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3()]),
        MaterialHelper.getMaterial(DiseasePhase.healthy)
      ),
    });
    this.#sharedObject.matrixAutoUpdate = false;
  }

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
            object: this.#sharedObject.duplicate(),
          };
          point.object.model.material =
            MaterialHelper.getMaterial(diseasePhase);
          point.object.setCoords(coords);
          point.object.updateMatrix();
          this.threeboxService.threebox.add(point.object);
          this.#points.set(personId, point);
        } else {
          this.#points.set(personId, {
            ...point,
            location,
            hour,
            diseasePhase,
          });

          const updateMaterial = () => {
            const { model } = point.object;
            const newMaterial = MaterialHelper.getMaterial(diseasePhase);
            if (model.material !== newMaterial) {
              model.material = newMaterial;
              this.#needsRepaint.next();
            }
          };

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
                point.object.updateMatrix();
                this.#needsRepaint.next();
              })
              .start()
              .onComplete(() => {
                finished++;
                updateMaterial();
                if (finished === started) {
                  observer.next();
                  observer.complete();
                }
              });
          } else {
            updateMaterial();
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
    this.#needsRepaint.next();
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
