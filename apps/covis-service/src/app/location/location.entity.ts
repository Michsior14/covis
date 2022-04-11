import type { Location, MinMaxRange, Stats, StatsHour } from '@covis/shared';
import { DetailLevel, DiseasePhase } from '@covis/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional } from 'class-validator';
import type { Point } from 'geojson';
import { Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm';

@Entity({ name: 'location' })
export class LocationEntity implements Location {
  @ApiProperty({ type: () => String })
  @ObjectIdColumn()
  id!: ObjectID;

  @ApiProperty()
  @Column()
  hour!: number;

  @ApiProperty()
  @Column()
  personId!: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: DiseasePhase })
  diseasePhase!: DiseasePhase;

  @ApiProperty()
  @Column()
  location!: Point;
}

export class Page {
  /**
   * The start index of items to return.
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
  @IsNumber()
  @Type(() => Number)
  lngw!: number;

  @IsNumber()
  @Type(() => Number)
  lats!: number;

  @IsNumber()
  @Type(() => Number)
  lnge!: number;

  @IsNumber()
  @Type(() => Number)
  latn!: number;

  @IsNumber()
  @Type(() => Number)
  hour!: number;

  @IsNumber()
  @Type(() => Number)
  zoom!: number;
}

export class HourRangeResponse implements MinMaxRange {
  @ApiProperty()
  min!: number;

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
  @ApiProperty()
  hours!: StatsHourResponse[];
}
