import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { DetailLevel } from '@covis/shared';
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
    details: new FormControl(this.visualizationRepository.details),
  };

  constructor(
    private readonly visualizationRepository: VisualizationRepository
  ) {}

  public save(): void {
    this.visualizationRepository.speed =
      this.controls.speed.value * msPerSecond;
    this.visualizationRepository.fps = this.controls.fps.value;
    this.visualizationRepository.details = this.controls.details.value;
  }

  public speedFormatLabel(value: number): string {
    return `${value}s`;
  }

  public detailsFormatLabel(value: DetailLevel): string {
    switch (value) {
      case DetailLevel.low:
        return 'Low';
      case DetailLevel.medium:
        return 'Mid';
      case DetailLevel.high:
        return 'High';
    }
  }
}
