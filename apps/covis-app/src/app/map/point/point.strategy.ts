import { Point, Position } from 'geojson';

export enum StrategyType {
  random = 'random',
  hashed = 'hashed',
  normal = 'normal',
}

export interface Strategy {
  reset(): void;
  coord(location: Point, personId: number): Position;
}

const epsilon = 0.0001;
const halfEpsilon = epsilon / 2;

/**
 * Returns randomized coordinate modifiers.
 *
 * @param value The value to determine modifier sign.
 * @param random The random function.
 */
const getModifiers = (
  value: number,
  random: () => number
): [() => number, number, number] => {
  const modifier = value % 2 ? -epsilon : epsilon;
  const halfModifier = Math.sign(modifier) * halfEpsilon;
  const sideSign = () => Math.sign((random() + 0.01) * 2 - 1); // +0.01 to avoid 0
  return [sideSign, modifier, halfModifier];
};

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
      const [sideSign, modifier, halfModifier] = getModifiers(
        count,
        Math.random.bind(Math)
      );

      coordinates = coordinates.map(
        (coord) =>
          coord + sideSign() * (Math.random() * modifier - halfModifier)
      );
    }

    return coordinates;
  }
}

/**
 * Adds random but stable (based on personId) modifier to lat/lon.
 */
export class HashStrategy implements Strategy {
  public reset(): void {
    // noop
  }

  public coord(location: Point, personId: number): Position {
    let { coordinates } = location;

    const next = this.random(personId);
    const [sideSign, modifier, halfModifier] = getModifiers(
      personId,
      next.bind(next)
    );

    coordinates = coordinates.map(
      (coord) => coord + sideSign() * (next() * modifier - halfModifier)
    );
    return coordinates;
  }

  // Based on https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32
  private random(seed: number): () => number {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
}
