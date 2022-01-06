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
import { dieaseColor } from '../point/material';
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

  public readonly legend = [
    {
      color: dieaseColor.susceptible,
      name: 'Susceptible',
    },
    {
      color: dieaseColor.immunity,
      name: 'Immune',
    },
    {
      color: dieaseColor.hospitalized,
      name: 'Hospitalized',
    },
    {
      color: dieaseColor.icu,
      name: 'ICU',
    },
    {
      color: dieaseColor.dead,
      name: 'Dead',
    },
    {
      color: dieaseColor.healthy,
      name: 'Healthy',
    },
    {
      color: dieaseColor.asymptomatic_contagious_early_stage,
      name: 'Asymptomatic Contagious (Early Stage)',
    },
    {
      color: dieaseColor.asymptomatic_contagious_middle_stage,
      name: 'Asymptomatic Contagious (Middle Stage)',
    },
    {
      color: dieaseColor.asymptomatic_contagious_late_stage,
      name: 'Asymptomatic Contagious (Late Stage)',
    },
    {
      color: dieaseColor.symptomatic_early_stage,
      name: 'Symptomatic (Early Stage)',
    },
    {
      color: dieaseColor.symptomatic_middle_stage,
      name: 'Symptomatic (Middle Stage)',
    },
    {
      color: dieaseColor.symptomatic_late_stage,
      name: 'Symptomatic (Late Stage)',
    },
  ];

  constructor(private readonly legendRepository: LegendRepository) {}

  /**
   * Toggle the legend.
   */
  public toggle(): void {
    this.legendRepository.toggle();
  }
}
