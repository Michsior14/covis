import type { Person } from '@covis/shared';
import { Gender } from '@covis/shared';
import type { Point } from 'geojson';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'person' })
export class PersonEntity implements Person {
  @PrimaryColumn('int')
  id!: number;

  @Column()
  type!: string;

  @Column('int')
  age!: number;

  @Column({ type: 'enum', enum: Gender })
  gender!: Gender;

  @Column('int')
  homeId!: number;

  @Column('int')
  homeSubId!: number;

  @Column('int')
  workId!: number;

  @Column('int')
  schoolId!: number;

  @Index('person_location_idx', { spatial: true })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location!: Point;
}
