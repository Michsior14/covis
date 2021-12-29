import { Injectable } from '@angular/core';
import { createState, select, Store, withProps } from '@ngneat/elf';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { produce } from '../../shared/produce';

export interface LegendProps {
  open: boolean;
}

const initialProps = Object.freeze<LegendProps>({
  open: false,
});

const store = new Store({
  name: 'legend',
  ...createState(withProps<LegendProps>(initialProps)),
});
persistState(store, { storage: localStorageStrategy });

@Injectable({ providedIn: 'root' })
export class LegendRepository {
  public isOpen = store.pipe(select((state) => state.open));

  public toggle(): void {
    store.update(produce((state) => (state.open = !state.open)));
  }
}
