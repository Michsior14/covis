import type { Point } from 'geojson';

export enum Gender {
  famale = 'F',
  male = 'M',
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
