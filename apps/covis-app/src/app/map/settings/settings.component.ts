import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { VisualizationRepository } from '../visualization/visualization.repository';

const msPerSecond = 1000;

@Component({
  selector: 'covis-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  public readonly controls = {
    speed: new FormControl(this.visualizationRepository.speed / msPerSecond),
    fps: new FormControl(this.visualizationRepository.fps),
  };

  constructor(
    private readonly visualizationRepository: VisualizationRepository
  ) {}

  public save(): void {
    this.visualizationRepository.speed =
      this.controls.speed.value * msPerSecond;
    this.visualizationRepository.fps = this.controls.fps.value;
  }

  public formatLabel(value: number): string {
    return `${value}s`;
  }
}
