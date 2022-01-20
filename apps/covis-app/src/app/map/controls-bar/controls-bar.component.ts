import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { merge, Subject, takeUntil, tap } from 'rxjs';
import { SettingsComponent } from '../settings/settings.component';
import {
  VisualizationRepository,
  VisualizationState,
} from '../visualization/visualization.repository';
import { ControlsBarRepository } from './controls-bar.repository';

@Component({
  selector: 'covis-controls-bar',
  templateUrl: './controls-bar.component.html',
  styleUrls: ['./controls-bar.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('opened', [
      state('true', style({ height: '*' })),
      state('false', style({ height: '0px' })),
      transition('true <=> false', animate('100ms ease-in-out')),
    ]),
  ],
})
export class ControlsBarComponent implements OnInit, OnDestroy {
  public readonly isOpen = this.controlsBarRepository.isOpen;
  public readonly visualization = this.visualizationRepository.stateChange;
  public readonly currentTime = this.visualizationRepository.currentTimeChange;
  public readonly minTime = this.visualizationRepository.minTimeChange;
  public readonly maxTime = this.visualizationRepository.maxTimeChange;

  public readonly sliderControl = new FormControl(
    this.visualizationRepository.hour
  );
  public readonly VisualizationState = VisualizationState;

  #destoryer = new Subject<void>();

  constructor(
    private readonly controlsBarRepository: ControlsBarRepository,
    private readonly visualizationRepository: VisualizationRepository,
    private readonly dialog: MatDialog
  ) {}

  public ngOnInit(): void {
    merge(
      this.currentTime.pipe(
        tap((value) => this.sliderControl.setValue(value, { emitEvent: false }))
      ),
      this.sliderControl.valueChanges.pipe(
        tap((value) => this.visualizationRepository.setTime(value))
      )
    )
      .pipe(takeUntil(this.#destoryer))
      .subscribe();
  }

  public ngOnDestroy(): void {
    this.#destoryer.next();
    this.#destoryer.complete();
  }

  /**
   * Toggle the visibility of the controls bar.
   */
  public toggleBar(): void {
    this.controlsBarRepository.toggle();
  }

  /**
   * Toggle the visualization.
   */
  public toggleVisualization(): void {
    this.visualizationRepository.toggle();
  }

  /**
   * Stop the visualization.
   */
  public stop(): void {
    this.visualizationRepository.stop();
  }

  /**
   * Open the settings dialog.
   */
  public openSettings(): void {
    this.visualizationRepository.pause();
    this.dialog.open(SettingsComponent);
  }
}
