import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { MinMaxRange } from '@covis/shared';
import { Observable, tap } from 'rxjs';
import { VisualizationRepository } from '../visualization/visualization.repository';
import { LocationService } from './location.service';

@Injectable({
  providedIn: 'root',
})
export class RangeResolver implements Resolve<MinMaxRange> {
  constructor(
    private readonly locationService: LocationService,
    private readonly visualizationRepository: VisualizationRepository
  ) {}

  /**
   * Resolves the min and max hour range for the visualization on first page load
   */
  public resolve(): Observable<MinMaxRange> {
    return this.locationService
      .getHourRange()
      .pipe(
        tap(({ min, max }) =>
          this.visualizationRepository.setMinMaxTime(
            Math.trunc(min),
            Math.trunc(max)
          )
        )
      );
  }
}
