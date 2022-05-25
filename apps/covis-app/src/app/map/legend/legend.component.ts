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
import { DiseasePhase } from '@covis/shared';
import { combineLatest, map } from 'rxjs';
import { diseaseColor } from '../point/material';
import {
  Filters,
  VisualizationRepository,
} from '../visualization/visualization.repository';
import { LegendRepository } from './legend.repository';

@Component({
  selector: 'covis-legend',
  templateUrl: './legend.component.html',
  styleUrls: ['./legend.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('opened', [
      state('true', style({ height: '*', width: '*', visibility: 'visible' })),
      state(
        'false',
        style({ height: '24px', width: '74px', visibility: 'hidden' })
      ),
      transition('true <=> false', animate('100ms ease-in-out')),
    ]),
  ],
})
export class LegendComponent {
  public readonly isOpen = this.legendRepository.isOpen;

  public readonly stats = combineLatest([
    this.visualizationRepository.currentTimeChange,
    this.legendRepository.statsChange,
  ]).pipe(
    map(
      ([time, stats]) =>
        stats[time - this.visualizationRepository.minTime] ?? {}
    )
  );

  public readonly filters = this.visualizationRepository.filtersChange.pipe(
    map(() => {
      return Object.values(DiseasePhase).reduce(
        (acc, key) => ({
          ...acc,
          [key]: this.visualizationRepository.shouldBeVisible(key),
        }),
        {} as Filters
      );
    })
  );

  public readonly legend = [
    {
      type: DiseasePhase.susceptible,
      name: 'Susceptible',
    },
    {
      type: DiseasePhase.immunity,
      name: 'Immune',
    },
    {
      type: DiseasePhase.hospitalized,
      name: 'Hospitalized',
    },
    {
      type: DiseasePhase.intensiveCareUnit,
      color: diseaseColor.icu,
      name: 'ICU',
    },
    {
      type: DiseasePhase.dead,
      color: diseaseColor.dead,
      name: 'Dead',
    },
    {
      type: DiseasePhase.healthy,
      name: 'Healthy',
    },
    {
      type: DiseasePhase.asymptomaticContagiousEarlyStage,
      name: 'Asymptomatic Contagious (Early Stage)',
    },
    {
      type: DiseasePhase.asymptomaticContagiousMiddleStage,
      name: 'Asymptomatic Contagious (Middle Stage)',
    },
    {
      type: DiseasePhase.asymptomaticContagiousLateStage,
      name: 'Asymptomatic Contagious (Late Stage)',
    },
    {
      type: DiseasePhase.symptomaticEarlyStage,
      name: 'Symptomatic (Early Stage)',
    },
    {
      type: DiseasePhase.symptomaticMiddleStage,
      name: 'Symptomatic (Middle Stage)',
    },
    {
      type: DiseasePhase.symptomaticLateStage,
      name: 'Symptomatic (Late Stage)',
    },
  ].map((legend) => ({ ...legend, color: diseaseColor[legend.type] }));

  constructor(
    private readonly legendRepository: LegendRepository,
    private readonly visualizationRepository: VisualizationRepository
  ) {}

  /**
   * Toggle the legend.
   */
  public toggle(): void {
    this.legendRepository.toggle();
  }

  /**
   * Toggle the filter for the given phase.
   *
   * @param phase The disease phase.
   */
  public toggleFilter(phase: DiseasePhase): void {
    this.visualizationRepository.toggleFilter(phase);
  }
}
