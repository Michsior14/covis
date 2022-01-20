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
    preload: new FormControl(this.visualizationRepository.preload),
  };

  constructor(
    private readonly visualizationRepository: VisualizationRepository
  ) {}

  /**
   * Save the current values of the controls to the visualization repository.
   */
  public save(): void {
    this.visualizationRepository.speed =
      this.controls.speed.value * msPerSecond;
    this.visualizationRepository.fps = this.controls.fps.value;
    this.visualizationRepository.details = this.controls.details.value;
    this.visualizationRepository.preload = this.controls.preload.value;
  }

  /**
   * Format a number of seconds into a string
   *
   * @param value The value to format.
   * @returns The speed in seconds.
   */
  public speedFormatLabel(value: number): string {
    return `${value}s`;
  }

  /**
   * Get the string value of detail level.
   *
   * @param value The detail level.
   */
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
