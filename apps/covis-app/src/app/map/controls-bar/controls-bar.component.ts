import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
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
  public readonly visualization = this.visualizationRepository.state;
  public readonly currentTime = this.visualizationRepository.currentTime;

  public readonly VisualizationState = VisualizationState;

  constructor(
    private readonly controlsBarRepository: ControlsBarRepository,
    private readonly visualizationRepository: VisualizationRepository
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
}
