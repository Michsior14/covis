import { Point, Position } from 'geojson';

export enum StrategyType {
  random = 'random',
  normal = 'normal',
}

export interface Strategy {
  reset(): void;
  coord(location: Point): Position;
}

/**
 * Adds to the same coordinates small random modifier of lat/lon.
 */
export class RandomStrategy implements Strategy {
  #counts = new Map<string, number>();

  public reset(): void {
    this.#counts.clear();
  }

  public coord(location: Point): Position {
    let { coordinates } = location;
    const coordsKey = coordinates.join(',');
    const count = (this.#counts.get(coordsKey) ?? 0) + 1;
    this.#counts.set(coordsKey, count);

    if (count > 1) {
      coordinates = coordinates.map((coord) => coord + Math.random() * 0.0001);
    }

    return coordinates;
  }
}

/**
 * Noop strategy.
 */
export class NormalStrategy implements Strategy {
  public reset(): void {
    // noop
  }

  public coord(location: Point): Position {
    return location.coordinates;
  }
}
