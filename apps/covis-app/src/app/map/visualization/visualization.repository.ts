import { Injectable } from '@angular/core';
import { createState, select, Store, withProps } from '@ngneat/elf';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { map } from 'rxjs/operators';
import { produce } from '../../shared/produce';

const startHour = 1878;

export enum VisualizationState {
  running = 'running',
  paused = 'paused',
  stopped = 'stopped',
  finished = 'finished',
}

export interface VisualizationProps {
  state: VisualizationState;
  currentTime: number;
}

const initialProps = Object.freeze<VisualizationProps>({
  state: VisualizationState.stopped,
  currentTime: startHour,
});

const store = new Store({
  name: 'visualization',
  ...createState(withProps<VisualizationProps>(initialProps)),
});
persistState(store, {
  storage: localStorageStrategy,
  source: (store) => {
    // Don't save the visualization current state
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return store.pipe(map(({ state, ...rest }) => rest));
  },
});

@Injectable({ providedIn: 'root' })
export class VisualizationRepository {
  public state = store.pipe(select((state) => state.state));

  public currentTime = store.pipe(select((state) => state.currentTime));

  public get hour(): number {
    return store.query((state) => state.currentTime);
  }

  public toggle(): void {
    store.update(
      produce((state) => {
        if (state.state === VisualizationState.finished) {
          state.state = VisualizationState.running;
          state.currentTime = startHour;
        } else {
          state.state =
            state.state === VisualizationState.running
              ? VisualizationState.paused
              : VisualizationState.running;
        }
      })
    );
  }

  public start(): void {
    store.update(
      produce((state) => (state.state = VisualizationState.running))
    );
  }

  public pause(): void {
    store.update(produce((state) => (state.state = VisualizationState.paused)));
  }

  public finish(): void {
    store.update(
      produce((state) => (state.state = VisualizationState.finished))
    );
  }

  public stop(): void {
    store.update(
      produce((state) => {
        state.state = VisualizationState.stopped;
        state.currentTime = startHour;
      })
    );
  }

  public nextHour(): void {
    store.update(produce((state) => state.currentTime++));
  }

  public zoomChanged(): void {
    if (store.getValue().state === VisualizationState.running) {
      this.stop();
      this.start();
    }
  }
}
