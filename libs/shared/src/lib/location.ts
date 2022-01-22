import type { Point } from 'geojson';

export enum DiseasePhase {
  asymptomaticContagiousEarlyStage = 'asymptomatic_contagious_early_stage',
  asymptomaticContagiousMiddleStage = 'asymptomatic_contagious_middle_stage',
  asymptomaticContagiousLateStage = 'asymptomatic_contagious_late_stage',
  dead = 'dead',
  healthy = 'healthy',
  hospitalized = 'hospitalized',
  intensiveCareUnit = 'icu',
  immunity = 'immunity',
  susceptible = 'susceptible',
  symptomaticEarlyStage = 'symptomatic_early_stage',
  symptomaticMiddleStage = 'symptomatic_middle_stage',
  symptomaticLateStage = 'symptomatic_late_stage',
}

export interface Location {
  hour: number;
  personId: number;
  diseasePhase: DiseasePhase;
  location: Point;
}

export type Stats = { [key in DiseasePhase]?: number };
