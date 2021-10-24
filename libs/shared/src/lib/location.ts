import type { Point } from 'geojson';

export enum DiseasePhase {
  healthy = 'HEALTHY',
  susceptible = 'Susceptible',
}

export interface Location {
  hour: number;
  personId: number;
  diseasePhase: DiseasePhase;
  location: Point;
}
