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
import { DiseasePhase } from '@covis/shared';
import { filter, Subject, takeUntil } from 'rxjs';
import { dieaseColor } from '../point/material';
import {
  VisualizationRepository,
  VisualizationState,
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
export class LegendComponent implements OnInit, OnDestroy {
  public readonly isOpen = this.legendRepository.isOpen;
  public readonly stats = this.legendRepository.statsChange;

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
      color: dieaseColor.icu,
      name: 'ICU',
    },
    {
      type: DiseasePhase.dead,
      color: dieaseColor.dead,
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
      type: DiseasePhase.symptomaticMiddleStage,
      name: 'Symptomatic (Late Stage)',
    },
  ].map((legend) => ({ ...legend, color: dieaseColor[legend.type] }));

  #destroyer = new Subject<void>();

  constructor(
    private readonly legendRepository: LegendRepository,
    private readonly visualizationRepository: VisualizationRepository
  ) {}

  public ngOnInit(): void {
    this.visualizationRepository.stateChange
      .pipe(
        filter((state) => state === VisualizationState.stopped),
        takeUntil(this.#destroyer)
      )
      .subscribe(() => this.legendRepository.resetStats());
  }

  public ngOnDestroy(): void {
    this.#destroyer.next();
    this.#destroyer.complete();
  }

  /**
   * Toggle the legend.
   */
  public toggle(): void {
    this.legendRepository.toggle();
  }
}
