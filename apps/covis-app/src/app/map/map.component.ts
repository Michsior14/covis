import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Map } from 'maplibre-gl';
import {
  EMPTY,
  expand,
  last,
  map,
  Subject,
  switchMap,
  take,
  takeUntil,
} from 'rxjs';
import { LocationService } from './location/location.service';
import { MapService } from './map.service';
import { PointService } from './point/point.service';

const startHour = 1878;

@Component({
  selector: 'covis-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements OnInit, OnDestroy {
  @ViewChild('container', { static: true })
  public container!: ElementRef<HTMLDivElement>;

  #currentHour = startHour;
  #visualisationRunning = false;
  #resetSignal = new Subject<void>();

  constructor(
    private readonly pointService: PointService,
    private readonly locationService: LocationService,
    private readonly mapService: MapService
  ) {}

  public ngOnInit(): void {
    this.mapService.initialize(this.container.nativeElement);
    this.mapService.map.on('zoomend', () => {
      if (this.#visualisationRunning) {
        this.pointService.reset();
        this.startVisalization();
      }
    });
  }

  public ngOnDestroy(): void {
    this.mapService.dispose();
    this.#resetSignal.next();
    this.#resetSignal.complete();
  }

  public resetTime(): void {
    this.#currentHour = startHour;
    this.pointService.reset();
    this.#resetSignal.next();
  }

  public startVisalization(): void {
    this.#resetSignal.next();
    this.#visualisationRunning = true;

    const loadHour = () => {
      const bounds = this.mapService.map.getBounds();
      const zoom = this.mapService.map.getZoom();
      return this.locationService
        .getAllForArea({
          hour: this.#currentHour++,
          zoom,
          sw: bounds.getSouthWest(),
          ne: bounds.getNorthEast(),
        })
        .pipe(
          take(1),
          switchMap((locations) =>
            this.pointService.add(locations).pipe(
              last(),
              map(() => locations.length > 0)
            )
          ),
          takeUntil(this.#resetSignal)
        );
    };

    loadHour()
      .pipe(expand((loadMore) => (loadMore ? loadHour() : EMPTY)))
      .subscribe({ complete: () => (this.#visualisationRunning = false) });
  }

  public loadPoints(): void {
    this.resetTime();
    this.startVisalization();
  }
}
