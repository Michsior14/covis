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

@Injectable({
  providedIn: 'root',
})
export class VisualizationService implements OnDestroy {
  #reset = new Subject<void>();
  #animationQueue = new Subject<Location[]>();

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
            return prev === VisualizationState.paused
              ? this.resume()
              : this.start();
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
    this.loadNext()
      .pipe(switchMap(() => this.loadNext()))
      .subscribe();

    this.#animationQueue
      .pipe(
        concatMap((locations) =>
          this.pointService.animate(locations).pipe(mapTo(locations))
        ),
        tap((locations) => {
          if (!locations.length) {
            this.#reset.next();
          } else {
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
    this.pointService.resume();
  }

  private resetAndRemovePoints(): void {
    this.reset();
    this.pointService.reset();
  }

  private loadNext(): Observable<unknown> {
    return this.loadHour().pipe(
      tap((locations) => {
        this.#animationQueue.next(locations);
        if (locations.length === 0) {
          this.visualizationRepository.finish();
        }
      }),
      takeUntil(this.#reset)
    );
  }

  private loadHour(): Observable<Location[]> {
    const bounds = this.mapService.map.getBounds();
    const zoom = this.mapService.map.getZoom();
    const hour = this.visualizationRepository.hour;
    this.visualizationRepository.nextHour();

    return this.locationService
      .getAllForArea({
        hour,
        zoom,
        sw: bounds.getSouthWest(),
        ne: bounds.getNorthEast(),
      })
      .pipe(
        toArray(),
        map((locations) => locations.flat())
      );
  }
}
