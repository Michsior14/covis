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
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { THREE, Threebox } from 'threebox-plugin';
import { LocationService } from './location/location.service';

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

  public loadPoints(): void {
    const bounds = this.map.getBounds();
    const zoom = this.map.getZoom();

    const dotGeometry = new THREE.BufferGeometry();
    dotGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(new THREE.Vector3().toArray(), 3)
    );
    const dotMaterial = new THREE.ShaderMaterial({
      vertexShader: `
              uniform float size;

              void main() {
                vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                gl_PointSize = size;
                gl_Position = projectionMatrix * mvPosition;
              }
            `,
      fragmentShader: `
              #ifdef GL_OES_standard_derivatives
              #extension GL_OES_standard_derivatives : enable
              #endif
              uniform vec3 color;

              void main() {
                float alpha = 1.0;
                vec2 cxy = 2.0 * gl_PointCoord - 1.0;
                float r = dot(cxy, cxy);
                #ifdef GL_OES_standard_derivatives
                  float delta = fwidth(r);
                  alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
                #endif
                gl_FragColor = vec4( color, alpha );
              }
            `,
      uniforms: {
        size: { value: 10.0 },
        color: { value: new THREE.Color(0xff0000) },
      },
      transparent: true,
    });

    // let count = 0;
    this.locationService
      .getAllForArea({
        hour: 0,
        zoom,
        sw: bounds.getSouthWest(),
        ne: bounds.getNorthEast(),
      })
      .subscribe((locations) => {
        // count += locations.length;
        // console.log(`${count} rows processed.`);
        locations.forEach(({ location }) => {
          const cube = this.threebox.Object3D({
            obj: new THREE.Points(dotGeometry, dotMaterial),
          });
          cube.setCoords(location.coordinates.reverse());
          this.threebox.add(cube);
        });
      });
  }

  private animateStats(): void {
    requestAnimationFrame(() => this.animateStats());
    this.stats.update();
  }
}
