import { Injectable, OnDestroy } from '@angular/core';
import { Location, Stats } from '@covis/shared';
import {
  asapScheduler,
  concatMap,
  EMPTY,
  expand,
  map,
  mapTo,
  Observable,
  pairwise,
  startWith,
  Subject,
  switchMapTo,
  takeUntil,
  tap,
  timer,
  toArray,
  zip,
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
  stats: Stats;
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
    this.visualizationRepository.loading = true;
    this.visualizationRepository.syncPreviousTime();

    if (sync) {
      this.visualizationRepository.syncPreloadTime();
    }

    this.preload(this.visualizationRepository.preload);

    this.#animationQueue
      .pipe(
        concatMap((item) => {
          if (this.visualizationRepository.previousTime !== item.hour - 1) {
            this.#animationQueue.next(item);
            // Defer the execution to avoid infinite loop.
            return timer(0).pipe(switchMapTo(EMPTY));
          }
          this.visualizationRepository.loading = false;
          // Defer the animation to increase performance.
          return timer(0).pipe(
            switchMapTo(this.pointService.animate(item.locations, item.stats)),
            mapTo(item)
          );
        }),
        tap((item) => {
          if (item.hour >= this.visualizationRepository.maxTime) {
            this.visualizationRepository.finish();
            return;
          }

          // Load the next hours after each animation batch
          this.preload(this.visualizationRepository.preload - 1);

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
   * Preload the next batch of hours.
   * @param hours The number of hours to preload.
   */
  private preload(hours: number): void {
    this.loadNext()
      .pipe(
        expand(
          (_, index) => (index < hours ? this.loadNext() : EMPTY),
          Infinity,
          asapScheduler
        )
      )
      .subscribe();
  }

  /**
   * Load the next batch of points.
   */
  private loadNext(): Observable<unknown> {
    return this.loadHour().pipe(
      tap((item) => this.#animationQueue.next(item)),
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

    if (hour > this.visualizationRepository.maxTime) {
      return EMPTY;
    }

    return zip(
      this.locationService
        .getAllForArea({
          hour,
          zoom,
          sw: bounds.getSouthWest(),
          ne: bounds.getNorthEast(),
          details,
        })
        .pipe(toArray()),
      this.locationService.getHourStats(hour)
    ).pipe(
      map(([locations, stats]) => ({
        hour,
        locations: locations.flat(),
        stats,
      }))
    );
  }
}
