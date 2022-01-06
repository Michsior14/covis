import { Injectable } from '@angular/core';
import { createState, select, Store, withProps } from '@ngneat/elf';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { produce } from '../../shared/produce';

export interface ControlsBarProps {
  open: boolean;
}

const initialProps = Object.freeze<ControlsBarProps>({
  open: true,
});

const store = new Store({
  name: 'controls',
  ...createState(withProps<ControlsBarProps>(initialProps)),
});
persistState(store, { storage: localStorageStrategy });

@Injectable({ providedIn: 'root' })
export class ControlsBarRepository {
  public isOpen = store.pipe(select((state) => state.open));

  /**
   * Update the state of the store to toggle the open property.
   */
  public toggle(): void {
    store.update(produce((state) => (state.open = !state.open)));
  }
}
