import type { DetailLevel, Location, MinMaxRange, Stats } from '@covis/shared';
import { DiseasePhase } from '@covis/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Point } from 'geojson';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'location' })
export class LocationEntity implements Location {
  @ApiProperty()
  @PrimaryColumn('real')
  hour!: number;

  @ApiProperty()
  @PrimaryColumn('int')
  personId!: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: DiseasePhase })
  diseasePhase!: DiseasePhase;

  @ApiProperty()
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
  @ApiProperty()
  min!: number;
  @ApiProperty()
  max!: number;
}

export class StatsResponse implements Stats {
  @ApiPropertyOptional()
  [DiseasePhase.asymptomaticContagiousEarlyStage]?: number;
  @ApiPropertyOptional()
  [DiseasePhase.asymptomaticContagiousMiddleStage]?: number;
  @ApiPropertyOptional()
  [DiseasePhase.asymptomaticContagiousLateStage]?: number;
  @ApiPropertyOptional()
  [DiseasePhase.dead]?: number;
  @ApiPropertyOptional()
  [DiseasePhase.healthy]?: number;
  @ApiPropertyOptional()
  [DiseasePhase.hospitalized]?: number;
  @ApiPropertyOptional()
  [DiseasePhase.immunity]?: number;
  @ApiPropertyOptional()
  [DiseasePhase.intensiveCareUnit]?: number;
  @ApiPropertyOptional()
  [DiseasePhase.susceptible]?: number;
  @ApiPropertyOptional()
  [DiseasePhase.symptomaticEarlyStage]?: number;
  @ApiPropertyOptional()
  [DiseasePhase.symptomaticMiddleStage]?: number;
  @ApiPropertyOptional()
  [DiseasePhase.symptomaticLateStage]?: number;
}
