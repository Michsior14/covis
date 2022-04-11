import type { Person } from '@covis/shared';
import { Gender } from '@covis/shared';
import type { Point } from 'geojson';
import {
  Column,
  Entity,
  ObjectID,
  ObjectIdColumn,
  PrimaryColumn,
} from 'typeorm';

@Entity({ name: 'person' })
export class PersonEntity implements Person {
  @ObjectIdColumn()
  _id!: ObjectID;

  @PrimaryColumn()
  id!: number;

  @Column()
  agentId!: number;

  @Column()
  type!: string;

  @Column()
  age!: number;

  @Column({ type: 'enum', enum: Gender })
  gender!: Gender;

  @Column()
  homeId!: number;

  @Column()
  homeSubId!: number;

  @Column()
  workId!: number;

  @Column()
  schoolId!: number;

  @Column()
  location!: Point;
}
