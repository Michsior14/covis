import { Injectable, OnDestroy } from '@angular/core';
import { Location } from '@covis/shared';
import {
  concatMap,
  map,
  mapTo,
  Observable,
  pairwise,
  startWith,
  Subject,
  switchMap,
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

  public initialize(): Observable<unknown> {
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
                return this.start();
              default:
                return this.start();
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

  private start(): void {
    // Preload the first two hours
    this.visualizationRepository.loading = true;
    this.loadNext()
      .pipe(
        switchMap(() => this.loadNext()),
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
          if (item.hour > this.visualizationRepository.maxTime) {
            this.#reset.next();
          } else {
            this.visualizationRepository.nextHour();
            // Load the next hour after each animation batch
            this.loadNext().subscribe();
          }
        }),
        takeUntil(this.#reset)
      )
      .subscribe();
  }

  private reset(): void {
    this.#reset.next();
  }

  private pause(): void {
    this.pointService.pause();
  }

  private resume(): void {
    if (this.pointService.resume()) {
      return;
    }

    this.reset();
    this.start();
  }

  private resetAndRemovePoints(): void {
    this.reset();
    this.pointService.reset();
  }

  private loadNext(): Observable<unknown> {
    return this.loadHour().pipe(
      tap((item) => {
        this.#animationQueue.next(item);
        if (item.hour > this.visualizationRepository.maxTime) {
          this.visualizationRepository.finish();
        }
      }),
      takeUntil(this.#reset)
    );
  }

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
