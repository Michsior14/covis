import {
  DetailLevel,
  DiseasePhase,
  Location,
  MinMaxRange,
  Stats,
  StatsHour,
} from '@covis/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional } from 'class-validator';
import type { Point, Position } from 'geojson';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

export class PointEntity implements Point {
  /**
   * The GeoJson type
   */
  @ApiProperty()
  type: 'Point' = 'Point';

  /**
   * The point coordinates
   */
  @ApiProperty()
  coordinates!: Position;
}

@Entity({ name: 'location' })
@Index('location_hour_personId_location_idx', { synchronize: false })
export class LocationEntity implements Location {
  /**
   * The simulation hour
   */
  @ApiProperty()
  @PrimaryColumn('real')
  hour!: number;

  /**
   * The person id associated with this location
   */
  @ApiProperty()
  @PrimaryColumn('int')
  personId!: number;

  /**
   * The person disease phase
   */
  @ApiProperty()
  @Column({ type: 'enum', enum: DiseasePhase })
  diseasePhase!: DiseasePhase;

  /**
   * The current location
   */
  @ApiProperty()
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location!: PointEntity;
}

export class Page {
  /**
   * The start index of items to return
   */
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  from?: number = 0;
  /**
   * The number of items to return
   */
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  take?: number = 100;
  /**
   * The details level
   */
  @IsEnum(DetailLevel)
  @Transform(({ value }) => DetailLevel[value])
  @IsOptional()
  details?: DetailLevel;
}

export class AreaRequest {
  /**
   * The longitude of the left bottom corner of the area
   */
  @IsNumber()
  @Type(() => Number)
  lngw!: number;

  /**
   * The latitude of the left bottom corner of the area
   */
  @IsNumber()
  @Type(() => Number)
  lats!: number;

  /**
   * The longitude of the right top corner of the area
   */
  @IsNumber()
  @Type(() => Number)
  lnge!: number;

  /**
   * The latitude of the right top corner of the area
   */
  @IsNumber()
  @Type(() => Number)
  latn!: number;

  /**
   * The hour of simulation
   */
  @IsNumber()
  @Type(() => Number)
  hour!: number;

  /**
   * The current map zoom
   */
  @IsNumber()
  @Type(() => Number)
  zoom!: number;
}

export class HourRangeResponse implements MinMaxRange {
  /**
   * The first hour of the simulation
   */
  @ApiProperty()
  min!: number;

  /**
   * The last hour of the simulation
   */
  @ApiProperty()
  max!: number;
}

export class StatsHourResponse implements StatsHour {
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

export class StatsResponse implements Stats {
  /**
   * The statistics of disease phases per simulation hour
   */
  @ApiProperty()
  hours!: StatsHourResponse[];
}
