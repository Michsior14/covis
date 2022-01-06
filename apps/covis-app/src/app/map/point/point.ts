import type { Location } from '@covis/shared';
import type { ShaderMaterial } from 'three';

type Object3D = THREE.Object3D & {
  setCoords: (coords: number[]) => void;
  coordinates: number[];
  model: { material: ShaderMaterial };
};

export type Point = Location & {
  object: Object3D;
};
