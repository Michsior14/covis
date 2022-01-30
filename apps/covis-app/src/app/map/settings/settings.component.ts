import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { DetailLevel } from '@covis/shared';
import { filter, merge, Subject, takeUntil, tap } from 'rxjs';
import { Strategy } from '../point/point.strategy';
import { VisualizationRepository } from '../visualization/visualization.repository';

const msPerSecond = 1000;

@Component({
  selector: 'covis-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit, OnDestroy {
  private speedSteps = [20, 10, 5, 2, 1, 0.5, 0.25];

  private readonly initialValues = {
    speed: this.speedSteps.indexOf(
      this.visualizationRepository.speed / msPerSecond
    ),
    fps: this.visualizationRepository.fps,
    details: this.visualizationRepository.details,
    preload: this.visualizationRepository.preload,
    strategy: this.visualizationRepository.strategy,
  } as const;

  public readonly controls = Object.entries(this.initialValues).reduce(
    (acc, [key, value]) => ({ ...acc, [key]: new FormControl(value) }),
    {} as Record<keyof typeof this.initialValues, FormControl>
  );

  public strategies = Object.values(Strategy);

  #destroy = new Subject<void>();

  constructor(
    private readonly visualizationRepository: VisualizationRepository
  ) {}

  public ngOnInit(): void {
    merge(
      this.controls.preload.valueChanges.pipe(
        filter(
          (value) => value < 5 && this.speedSteps[this.controls.speed.value] < 1
        ),
        tap(() => this.controls.speed.setValue(4, { emitEvent: false }))
      ),
      this.controls.speed.valueChanges.pipe(
        filter(
          (value) =>
            this.speedSteps[value] < 1 && this.controls.preload.value < 5
        ),
        tap(() => this.controls.preload.setValue(5, { emitEvent: false }))
      )
    )
      .pipe(takeUntil(this.#destroy))
      .subscribe();
  }

  public ngOnDestroy(): void {
    this.#destroy.next();
    this.#destroy.complete();
  }

  /**
   * Save the current values of the controls to the visualization repository.
   */
  public save(): void {
    if (!this.settingsChanged()) {
      return;
    }

    this.visualizationRepository.speed =
      this.speedSteps[this.controls.speed.value] * msPerSecond;
    this.visualizationRepository.fps = this.controls.fps.value;
    this.visualizationRepository.details = this.controls.details.value;
    this.visualizationRepository.preload = this.controls.preload.value;
    this.visualizationRepository.strategy = this.controls.strategy.value;
    this.visualizationRepository.needsRestart();
  }

  /**
   * Format a number of seconds into a string
   */
  public get speedFormatLabel(): (value: number) => string {
    return (value: number): string => {
      return `${this.speedSteps[value]}s`;
    };
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

  private settingsChanged(): boolean {
    const keys = Object.keys(
      this.initialValues
    ) as (keyof typeof this.initialValues)[];
    return keys.some(
      (key) => this.initialValues[key] !== this.controls[key].value
    );
  }
}
