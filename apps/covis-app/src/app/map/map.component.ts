import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { MapService } from './map.service';
import { VisualizationService } from './visualization.service';

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

  constructor(
    private readonly visualizationService: VisualizationService,
    private readonly mapService: MapService
  ) {}

  public ngOnInit(): void {
    this.mapService.initialize(this.container.nativeElement);
    this.mapService.map.on('zoomend', () => {
      if (this.visualizationService.isRunning) {
        this.visualizationService.stop();
        this.visualizationService.start();
      }
    });
  }

  public ngOnDestroy(): void {
    this.mapService.dispose();
    this.visualizationService.stop();
  }

  public resetTime(): void {
    this.visualizationService.resetTo(startHour);
  }

  public startVisalization(): void {
    this.visualizationService.start();
  }

  public loadPoints(): void {
    this.resetTime();
    this.startVisalization();
  }
}
