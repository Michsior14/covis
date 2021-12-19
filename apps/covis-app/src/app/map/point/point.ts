import type { Location } from '@covis/shared';

type Object3D = THREE.Object3D & {
  setCoords: (coords: number[]) => void;
  coordinates: number[];
  model: any; // TODO type
};

export type Point = Location & {
  object: Object3D;
};
