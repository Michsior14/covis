import { Injectable } from '@angular/core';
import { Location } from '@covis/shared';
import {
  concatMap,
  map,
  mapTo,
  Observable,
  Subject,
  switchMap,
  takeUntil,
  tap,
  toArray,
} from 'rxjs';
import { LocationService } from './location/location.service';
import { MapService } from './map.service';
import { PointService } from './point/point.service';

@Injectable({
  providedIn: 'root',
})
export class VisualizationService {
  public get isRunning(): boolean {
    return this.#isRunning;
  }

  public get currentHour(): number {
    return this.#currentHour;
  }

  #currentHour = 0;
  #isRunning = false;
  #reset = new Subject<void>();
  #animationQueue = new Subject<Location[]>();

  constructor(
    private readonly pointService: PointService,
    private readonly locationService: LocationService,
    private readonly mapService: MapService
  ) {}

  public resetTo(hour: number): void {
    this.#currentHour = hour;
    this.stop();
  }

  public start(): void {
    if (this.#isRunning) {
      return;
    }

    this.#isRunning = true;

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
      .subscribe({ complete: () => (this.#isRunning = false) });
  }

  public stop(): void {
    this.#reset.next();
    this.pointService.reset();
  }

  private loadNext(): Observable<unknown> {
    return this.loadHour().pipe(
      tap((locations) => {
        this.#animationQueue.next(locations);
        if (locations.length === 0) {
          this.#isRunning = false;
        }
      }),
      takeUntil(this.#reset)
    );
  }

  private loadHour(): Observable<Location[]> {
    const bounds = this.mapService.map.getBounds();
    const zoom = this.mapService.map.getZoom();
    const hour = this.#currentHour;
    this.#currentHour++;

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
