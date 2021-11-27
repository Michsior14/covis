import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Map, NavigationControl } from 'maplibre-gl';
import { LocationService } from './location/location.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Threebox, THREE } = require('threebox-plugin');

@Component({
  selector: 'covis-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements OnInit {
  @ViewChild('container', { static: true })
  public container!: ElementRef<HTMLDivElement>;

  private map!: Map;

  private treebox: typeof Threebox;
  private material = new THREE.MeshPhongMaterial({ color: 0x660000 });

  constructor(private readonly locationService: LocationService) {}

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
      minZoom: 0,
      maxZoom: 18,
      maxBounds: [
        [4.156124, 52.025582],
        [4.450131, 52.125786],
      ],
      dragRotate: false,
    });
    this.map.addControl(new NavigationControl({}));

    this.map.on('load', () => {
      this.map.addLayer({
        id: 'custom_layer',
        type: 'custom',
        renderingMode: '2d',
        onAdd: (map, context) => {
          (window as any).tb = this.treebox = new Threebox(map, context, {
            multiLayer: true,
          });
        },
        render: () => {
          this.treebox.update();
        },
        prerender: () => void 0,
        onRemove: () => void 0,
      });
    });
  }

  public loadPoints(): void {
    // let count = 0;
    this.locationService.getAllForHour(0).subscribe((locations) => {
      // count += locations.length;
      // console.log(`${count} rows processed.`);
      locations.forEach(({ location }) => {
        const geometry = new THREE.CircleGeometry(10, 32);
        const cube = this.treebox.Object3D({
          obj: new THREE.Mesh(geometry, this.material),
          units: 'meters',
        });
        cube.setCoords(location.coordinates.reverse());
        this.treebox.add(cube);
      });
    });
  }
}
