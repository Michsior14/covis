import { Injectable } from '@angular/core';
import { StatsHour } from '@covis/shared';
import { createState, select, Store, withProps } from '@ngneat/elf';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { map } from 'rxjs';
import { produce } from '../../shared/produce';

export interface LegendProps {
  open: boolean;
  stats: StatsHour[];
}

const initialProps = Object.freeze<LegendProps>({
  open: false,
  stats: [],
});

const store = new Store({
  name: 'legend',
  ...createState(withProps<LegendProps>(initialProps)),
});
persistState(store, {
  storage: localStorageStrategy,
  source: (store) => {
    // Don't save the stats current state
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return store.pipe(map(({ stats, ...rest }) => rest));
  },
});

@Injectable({ providedIn: 'root' })
export class LegendRepository {
  public isOpen = store.pipe(select((state) => state.open));
  public statsChange = store.pipe(select((state) => state.stats));

  public set stats(value: StatsHour[]) {
    store.update(produce((state) => (state.stats = value)));
  }

  public get areStatsEmpty(): boolean {
    return store.query((state) => state.stats.length === 0);
  }

  /**
   * Update the state of the store to toggle the open property.
   */
  public toggle(): void {
    store.update(produce((state) => (state.open = !state.open)));
  }
}
