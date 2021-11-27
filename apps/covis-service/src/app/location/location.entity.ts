import type { Location } from '@covis/shared';
import { DiseasePhase } from '@covis/shared';
import type { Point } from 'geojson';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Index(['hour', 'personId'], { unique: true })
@Entity({ name: 'location' })
export class LocationEntity implements Location {
  @PrimaryColumn('decimal')
  hour!: number;

  @PrimaryColumn('int')
  personId!: number;

  @Column({ type: 'enum', enum: DiseasePhase })
  diseasePhase!: DiseasePhase;

  @Index({ spatial: true })
  @Column({
    type: 'geography',
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
}
