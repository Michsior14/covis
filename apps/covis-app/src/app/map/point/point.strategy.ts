import { Point, Position } from 'geojson';

export enum Strategy {
  random = 'random',
  normal = 'normal',
}

/**
 * Adds to the same coordinates small random modifier of lat/lon.
 */
export const randomStrategy = (): ((location: Point) => Position) => {
  const counts = new Map<string, number>();
  return (location) => {
    let { coordinates } = location;
    const coordsKey = coordinates.join(',');
    const count = (counts.get(coordsKey) ?? 0) + 1;
    counts.set(coordsKey, count);

    if (count > 1) {
      coordinates = coordinates.map((coord) => coord + Math.random() / 10000);
    }

    return coordinates;
  };
};

/**
 * Noop strategy.
 */
export const normalStrategy = (): ((location: Point) => Position) => {
  return (location) => location.coordinates;
};
