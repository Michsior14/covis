import type { DetailLevel, Location, MinMaxRange } from '@covis/shared';
import { DiseasePhase } from '@covis/shared';
import type { Point } from 'geojson';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'location' })
export class LocationEntity implements Location {
  @PrimaryColumn('real')
  hour!: number;

  @PrimaryColumn('int')
  personId!: number;

  @Column({ type: 'enum', enum: DiseasePhase })
  diseasePhase!: DiseasePhase;

  @Index('location_location_idx', { spatial: true })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location!: Point;
}

export class Page {
  /**
   * The start index of items to return.
   */
  from?: number = 0;
  /**
   * The number of items to return
   */
  take?: number = 100;
  /**
   * The details level
   */
  details?: DetailLevel;
}

export class AreaRequest {
  lngw!: number;
  lats!: number;
  lnge!: number;
  latn!: number;
  hour!: number;
  zoom!: number;
}

export class HourRangeResponse implements MinMaxRange {
  min!: number;
  max!: number;
}
