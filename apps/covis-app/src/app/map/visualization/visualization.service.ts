import { Injectable, OnDestroy } from '@angular/core';
import { Location } from '@covis/shared';
import {
  asapScheduler,
  BehaviorSubject,
  combineLatest,
  concatMap,
  EMPTY,
  first,
  map,
  merge,
  Observable,
  of,
  pairwise,
  scheduled,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  tap,
  timer,
  toArray,
} from 'rxjs';
import { LegendRepository } from '../legend/legend.repository';
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
  #animationPause = new BehaviorSubject<boolean>(false);
  #inQueue = 0;

  constructor(
    private readonly pointService: PointService,
    private readonly locationService: LocationService,
    private readonly mapService: MapService,
    private readonly visualizationRepository: VisualizationRepository,
    private readonly legendRepository: LegendRepository
  ) {}

  /**
   * When the visualization state changes, it will start, pause, or reset the visualization.
   *
   * @returns An observable that emits the previous state and the current state and filters changes.
   */
  public initialize(): Observable<unknown> {
    if (
      this.visualizationRepository.hour >=
        this.visualizationRepository.maxTime &&
      !this.visualizationRepository.isDefaultMaxTime
    ) {
      this.visualizationRepository.finish();
    }

    return merge(
      this.visualizationRepository.stateChange.pipe(
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
      ),
      this.visualizationRepository.filtersChange.pipe(
        tap(() => this.pointService.applyFilters())
      )
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
   */
  private start(sync = false): void {
    this.visualizationRepository.loading = true;
    this.visualizationRepository.syncPreviousTime();

    if (sync) {
      this.visualizationRepository.syncPreloadTime();
    }

    this.pointService.setStrategy(this.visualizationRepository.strategy);

    merge(
      this.initStats().pipe(
        tap(() => this.preload(this.visualizationRepository.preload))
      ),
      this.#animationQueue.pipe(
        concatMap((item) => {
          const waitForTheFirstBatch =
            this.visualizationRepository.loading &&
            this.#inQueue < this.visualizationRepository.preload;
          const hourOutOfSync =
            this.visualizationRepository.previousTime !== item.hour - 1;

          if (waitForTheFirstBatch || hourOutOfSync) {
            this.#animationQueue.next(item);
            // Defer the execution to avoid infinite loop.
            return timer(0).pipe(switchMap(() => EMPTY));
          }
          this.visualizationRepository.loading = false;
          // Defer the animation to increase performance.
          return timer(0, asapScheduler).pipe(
            switchMap(() =>
              // Do not start animation if the visualization is paused.
              this.#animationPause.pipe(
                first((paused) => !paused),
                switchMap(() => this.pointService.animate(item.locations)),
                tap(() => this.#inQueue--)
              )
            ),
            map(() => item)
          );
        }),
        tap((item) => {
          if (item.hour >= this.visualizationRepository.maxTime) {
            this.visualizationRepository.finish();
            return;
          }

          // Load the next hours after each animation batch
          this.preload(
            this.visualizationRepository.preload - this.#inQueue ?? 1
          );

          this.visualizationRepository.nextHour();
        })
      )
    )
      .pipe(takeUntil(this.#reset))
      .subscribe();
  }

  /**
   * It resets the animation state.
   */
  private reset(): void {
    this.#animationPause.next(false);
    this.#reset.next();
    this.#inQueue = 0;
  }

  /**
   * Pause the point animation.
   */
  private pause(): void {
    this.pointService.pause();
    this.#animationPause.next(true);
  }

  /**
   * Resume the animation.
   */
  private resume(): void {
    this.pointService.resume();
    this.#animationPause.next(false);
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
    if (hours <= 0) {
      return;
    }

    scheduled(
      combineLatest(new Array(hours).fill(0).map(() => this.loadNext())),
      asapScheduler
    ).subscribe();
  }

  /**
   * Load the next batch of points.
   */
  private loadNext(): Observable<unknown> {
    return this.loadHour().pipe(
      tap((item) => {
        this.#animationQueue.next(item);
        this.#inQueue++;
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
    const { preloadHour: hour, details } = this.visualizationRepository;
    this.visualizationRepository.preloadNextHour();

    if (hour > this.visualizationRepository.maxTime) {
      return EMPTY;
    }

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

  /**
   * Initialize stats if needed.
   */
  private initStats(): Observable<unknown> {
    return this.legendRepository.areStatsEmpty
      ? this.locationService
          .getStats()
          .pipe(tap(({ hours }) => (this.legendRepository.stats = hours)))
      : of(undefined);
  }
}
