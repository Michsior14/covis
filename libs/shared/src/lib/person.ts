import type { Point } from 'geojson';

export enum Gender {
  female = 'f',
  male = 'm',
}

export interface Person {
  id: number;
  type: string;
  age: number;
  gender: Gender;
  homeId: number;
  homeSubId: number;
  workId: number;
  schoolId: number;
  location: Point;
}
