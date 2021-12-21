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
  ViewEncapsulation,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
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
export class ControlsBarComponent {
  public readonly isOpen = this.controlsBarRepository.isOpen;
  public readonly visualization = this.visualizationRepository.stateChange;
  public readonly currentTime = this.visualizationRepository.currentTimeChange;

  public readonly VisualizationState = VisualizationState;

  constructor(
    private readonly controlsBarRepository: ControlsBarRepository,
    private readonly visualizationRepository: VisualizationRepository,
    private readonly dialog: MatDialog
  ) {}

  public toggleBar(): void {
    this.controlsBarRepository.toggle();
  }

  public toggleVisualization(): void {
    this.visualizationRepository.toggle();
  }

  public stop(): void {
    this.visualizationRepository.stop();
  }

  public openSettings(): void {
    this.visualizationRepository.pause();
    this.dialog.open(SettingsComponent);
  }
}
