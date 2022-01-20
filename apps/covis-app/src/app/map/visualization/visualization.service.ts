import { Injectable, OnDestroy } from '@angular/core';
import { Location } from '@covis/shared';
import {
  concatMap,
  EMPTY,
  expand,
  map,
  mapTo,
  Observable,
  pairwise,
  startWith,
  Subject,
  takeUntil,
  tap,
  toArray,
} from 'rxjs';
import { LocationService } from '../location/location.service';
import { MapService } from '../map.service';
import { PointService } from '../point/point.service';
import {
  VisualizationRepository,
  VisualizationState,
} from './visualization.repository';

interface QueueItem {
  hour: number;
  locations: Location[];
}

@Injectable({
  providedIn: 'root',
})
export class VisualizationService implements OnDestroy {
  #reset = new Subject<void>();
  #animationQueue = new Subject<QueueItem>();

  constructor(
    private readonly pointService: PointService,
    private readonly locationService: LocationService,
    private readonly mapService: MapService,
    private readonly visualizationRepository: VisualizationRepository
  ) {}

  /**
   * When the visualization state changes, it will start, pause, or reset the visualization.
   *
   * @returns An observable that emits the previous state and the current state.
   */
  public initialize(): Observable<unknown> {
    if (
      this.visualizationRepository.hour >= this.visualizationRepository.maxTime
    ) {
      this.visualizationRepository.finish();
    }

    return this.visualizationRepository.stateChange.pipe(
      startWith(VisualizationState.stopped),
      pairwise(),
      tap(([prev, state]) => {
        switch (state) {
          case VisualizationState.running:
            switch (prev) {
              case VisualizationState.paused:
                return this.resume();
              case VisualizationState.finished:
                this.resetAndRemovePoints();
                return this.start(true);
              default:
                return this.start(true);
            }
          case VisualizationState.paused:
            return this.pause();
          case VisualizationState.finished:
            return this.reset();
          case VisualizationState.stopped:
            return this.resetAndRemovePoints();
        }
      })
    );
  }

  public ngOnDestroy(): void {
    this.#reset.next();
    this.#reset.complete();
  }

  /**
   * Start the animation.
   *
   * @param sync Indicates if the preload time should be synced with the current time.
   *
   * @returns The animation queue.
   */
  private start(sync = false): void {
    this.visualizationRepository.needsMoreData = true;
    this.visualizationRepository.loading = true;

    if (sync) {
      this.visualizationRepository.syncPreloadTime();
    }

    // Preload n hours
    this.loadNext()
      .pipe(
        expand((_, index) =>
          index < this.visualizationRepository.preload ? this.loadNext() : EMPTY
        ),
        takeUntil(this.#reset)
      )
      .subscribe();

    this.#animationQueue
      .pipe(
        concatMap((item) => {
          this.visualizationRepository.loading = false;
          return this.pointService.animate(item.locations).pipe(mapTo(item));
        }),
        tap((item) => {
          if (item.hour >= this.visualizationRepository.maxTime) {
            this.visualizationRepository.finish();
            return;
          }

          if (this.visualizationRepository.needsMoreData) {
            // Load the next hour after each animation batch
            this.loadNext()
              .pipe(
                expand((_, index) =>
                  index < this.visualizationRepository.preload - 1
                    ? this.loadNext()
                    : EMPTY
                )
              )
              .subscribe();
          }
          this.visualizationRepository.nextHour();
        }),
        takeUntil(this.#reset)
      )
      .subscribe();
  }

  /**
   * It resets the animation state.
   */
  private reset(): void {
    this.#reset.next();
  }

  /**
   * Pause the point animation.
   */
  private pause(): void {
    this.pointService.pause();
  }

  /**
   * Resume the animation.
   */
  private resume(): void {
    if (this.pointService.resume()) {
      return;
    }

    this.reset();
    this.start();
  }

  /**
   * Reset the animation and remove all points.
   */
  private resetAndRemovePoints(): void {
    this.reset();
    this.pointService.reset();
  }

  /**
   * Load the next batch of points.
   */
  private loadNext(): Observable<unknown> {
    return this.loadHour().pipe(
      tap((item) => {
        this.#animationQueue.next(item);
        if (item.hour > this.visualizationRepository.maxTime) {
          this.visualizationRepository.needsMoreData = false;
        }
      }),
      takeUntil(this.#reset)
    );
  }

  /**
   * Load the points for the next hour.
   *
   * @returns Stream of the points.
   */
  private loadHour(): Observable<QueueItem> {
    const bounds = this.mapService.map.getBounds();
    const zoom = this.mapService.map.getZoom();
    const hour = this.visualizationRepository.preloadHour;
    const details = this.visualizationRepository.details;
    this.visualizationRepository.preloadNextHour();

    return this.locationService
      .getAllForArea({
        hour,
        zoom,
        sw: bounds.getSouthWest(),
        ne: bounds.getNorthEast(),
        details,
      })
      .pipe(
        toArray(),
        map((locations) => ({ hour, locations: locations.flat() }))
      );
  }
}
