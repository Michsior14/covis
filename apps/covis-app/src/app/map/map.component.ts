import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Map, NavigationControl } from 'maplibre-gl';
import {
  delay,
  EMPTY,
  expand,
  last,
  lastValueFrom,
  range,
  switchMap,
  take,
  withLatestFrom,
} from 'rxjs';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { Threebox } from 'threebox-plugin';
import { LocationService } from './location/location.service';
import { PointService } from './point/point.service';

@Component({
  selector: 'covis-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('container', { static: true })
  public container!: ElementRef<HTMLDivElement>;

  private map!: Map;

  private threebox: typeof Threebox;
  private stats = Stats();

  constructor(
    private readonly pointService: PointService,
    private readonly locationService: LocationService,
    private readonly ngZone: NgZone
  ) {}

  public ngOnInit(): void {
    this.map = new Map({
      container: this.container.nativeElement,
      style: {
        version: 8,
        sources: {
          basemap: {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: 'map',
            type: 'raster',
            source: 'basemap',
          },
        ],
      },
      minZoom: 11,
      maxZoom: 18,
      maxBounds: [
        [4.142325, 52.012505],
        [4.450131, 52.125786],
      ],
      antialias: true,
      dragRotate: false,
    });
    this.map.addControl(new NavigationControl({}));
  }

  public ngAfterViewInit(): void {
    this.threebox = new Threebox(
      this.map,
      this.map.getCanvas().getContext('webgl'),
      {
        defaultLights: true,
        passiveRendering: false,
      }
    );
    (window as any).tb = this.threebox;
    this.pointService.threebox = this.threebox;

    this.map.on('style.load', () => {
      this.map.addLayer({
        id: 'custom_layer',
        type: 'custom',
        renderingMode: '3d',
        onAdd: () => {
          this.animateStats();
        },
        render: () => {
          this.ngZone.runOutsideAngular(() => {
            this.threebox.update();
          });
        },
        prerender: () => void 0,
        onRemove: () => {
          this.threebox.dispose();
          (window as any).tb = null;
        },
      });
      this.container.nativeElement.appendChild(this.stats.dom);
    });
  }

  public ngOnDestroy(): void {
    this.map.remove();
  }

  public async loadPoints(): Promise<Promise<void>> {
    const bounds = this.map.getBounds();
    const zoom = this.map.getZoom();

    const loadHour = (hour: number) =>
      this.locationService
        .getAllForArea({
          hour,
          zoom,
          sw: bounds.getSouthWest(),
          ne: bounds.getNorthEast(),
        })
        .pipe(
          take(1),
          switchMap((locations) =>
            this.pointService.add(locations).pipe(last())
          )
        );

    let hour = 7;
    loadHour(hour)
      .pipe(expand(() => (hour < 18 ? loadHour(++hour) : EMPTY)))
      .subscribe();
  }

  private animateStats(): void {
    requestAnimationFrame(() => this.animateStats());
    this.stats.update();
  }
}
