import type { Person } from '@covis/shared';
import { Gender } from '@covis/shared';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { PointEntity } from '../location/location.entity';

@Entity({ name: 'person' })
export class PersonEntity implements Person {
  /**
   * The id
   */
  @PrimaryColumn('int')
  id!: number;

  /**
   * The type
   */
  @Column()
  type!: string;

  /**
   * The age
   */
  @Column('int')
  age!: number;

  /**
   * The person gender
   */
  @Column({ type: 'enum', enum: Gender })
  gender!: Gender;

  /**
   * The home id
   */
  @Column('int')
  homeId!: number;

  /**
   * The sub-home id
   */
  @Column('int')
  homeSubId!: number;

  /**
   * The work id
   */
  @Column('int')
  workId!: number;

  /**
   * The school id
   */
  @Column('int')
  schoolId!: number;

  /**
   * The home location
   */
  @Index('person_location_idx', { spatial: true })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location!: PointEntity;
}
