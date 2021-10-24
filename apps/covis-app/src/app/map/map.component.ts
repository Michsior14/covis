import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Map, NavigationControl } from 'maplibre-gl';

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

  public ngOnInit(): void {
    // const pointLayer: CustomLayerInterface = {
    //   id: 'points',
    //   type: 'custom',
    //   renderingMode: '2d',
    //   render(gl, matrix)
    // };

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
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: [4.3240294, 52.0697438],
      zoom: 12,
      antialias: true,
    });
    this.map.addControl(new NavigationControl());

    this.map.on('load', () => {
      // this.map.addLayer(pointLayer);
    });
  }
}
