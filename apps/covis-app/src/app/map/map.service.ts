import { Injectable, NgZone, OnDestroy } from '@angular/core';
import {
  AttributionControl,
  LngLatBoundsLike,
  Map,
  NavigationControl,
} from 'maplibre-gl';
import { Subject, takeUntil, tap } from 'rxjs';
import Stats from 'three/examples/jsm/libs/stats.module';
import { PointService } from './point/point.service';
import { ThreeboxService } from './threebox.service';

const mapBounds: LngLatBoundsLike = [
  [4.116037, 51.9953],
  [4.495351, 52.133693],
];

@Injectable({
  providedIn: 'root',
})
export class MapService implements OnDestroy {
  /**
   * The maplibre map instance
   */
  public get map(): Map {
    return this.#map;
  }

  #map!: Map;
  #stats = Stats();
  #repaintMap = false;
  #destroyer = new Subject<void>();

  constructor(
    private readonly threeboxService: ThreeboxService,
    private readonly pointsService: PointService,
    private readonly ngZone: NgZone
  ) {}

  /**
   * Initialize the map
   *
   * @param container The container element to render the map in
   */
  public initialize(container: HTMLElement): void {
    this.#stats.dom.id = 'covis-stats';
    this.#map = new Map({
      container,
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
      maxBounds: mapBounds,
      antialias: true,
      hash: true,
      dragRotate: false,
    })
      .addControl(
        new AttributionControl({
          customAttribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
        }),
        'top-right'
      )
      .addControl(new NavigationControl({}))
      .on('style.load', () => {
        this.#map.addLayer({
          id: 'custom_layer',
          type: 'custom',
          renderingMode: '3d',
          onAdd: () =>
            requestAnimationFrame((time) => this.animationLoop(time)),
          render: () => this.threeboxService.update(),
          prerender: () => void 0,
          onRemove: () => this.threeboxService.dispose(),
        });
        container.appendChild(this.#stats.dom);
      });
    this.pointsService.needsRepaint
      .pipe(
        tap(() => (this.#repaintMap = true)),
        takeUntil(this.#destroyer)
      )
      .subscribe();

    this.threeboxService.initialize(this.#map);
    this.pointsService.initialize();
  }

  public ngOnDestroy(): void {
    this.dispose();
    this.#destroyer.next();
    this.#destroyer.complete();
  }

  /**
   * Dispose the map and all its resources
   */
  public dispose(): void {
    this.#map.remove();
  }

  /**
   * The loop that updates the additional resources on each frame
   */
  private animationLoop(time: DOMHighResTimeStamp): void {
    requestAnimationFrame((time) => this.animationLoop(time));

    this.ngZone.runOutsideAngular(() => {
      this.#stats.update();
      this.pointsService.update(time);
      if (this.#repaintMap) {
        this.#map.triggerRepaint();
        this.#repaintMap = false;
      }
    });
  }
}
