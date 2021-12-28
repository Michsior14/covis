import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { connectable, Subject, takeUntil } from 'rxjs';
import { MapService } from './map.service';
import { VisualizationRepository } from './visualization/visualization.repository';
import { VisualizationService } from './visualization/visualization.service';

@Component({
  selector: 'covis-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements OnInit, OnDestroy {
  @ViewChild('container', { static: true })
  public readonly container!: ElementRef<HTMLDivElement>;

  public readonly fps = this.visualizationRepository.fpsChange;

  public readonly loading = connectable(
    this.visualizationRepository.loadingChange
  );

  #destroyer = new Subject<void>();

  constructor(
    private readonly visualizationRepository: VisualizationRepository,
    private readonly visualizationService: VisualizationService,
    private readonly mapService: MapService
  ) {}

  public ngOnInit(): void {
    this.loading.connect();
    this.mapService.initialize(this.container.nativeElement);
    this.mapService.map.on('zoomend', () =>
      this.visualizationRepository.zoomChanged()
    );

    this.visualizationService
      .initialize()
      .pipe(takeUntil(this.#destroyer))
      .subscribe();
  }

  public ngOnDestroy(): void {
    this.mapService.dispose();
  }
}
