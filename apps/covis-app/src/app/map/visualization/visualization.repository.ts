import { Injectable } from '@angular/core';
import { DetailLevel } from '@covis/shared';
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
  preloadTime: number;
  animationSpeed: number;
  loading: boolean;
  fps: boolean;
  details: DetailLevel;
}

const initialProps = Object.freeze<VisualizationProps>({
  state: VisualizationState.stopped,
  currentTime: startHour,
  preloadTime: startHour,
  animationSpeed: 5000,
  loading: false,
  fps: false,
  details: DetailLevel.medium,
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
  public stateChange = store.pipe(select((state) => state.state));

  public currentTimeChange = store.pipe(select((state) => state.currentTime));

  public fpsChange = store.pipe(select((state) => state.fps));

  public loadingChange = store.pipe(select((state) => state.loading));

  public get hour(): number {
    return store.query((state) => state.currentTime);
  }

  public get preloadHour(): number {
    return store.query((state) => state.preloadTime);
  }

  public get speed(): number {
    return store.query((state) => state.animationSpeed);
  }

  public set speed(value: number) {
    store.update(produce((state) => (state.animationSpeed = value)));
  }

  public get fps(): boolean {
    return store.query((state) => state.fps);
  }

  public set fps(value: boolean) {
    store.update(produce((state) => (state.fps = value)));
  }

  public set loading(value: boolean) {
    store.update(produce((state) => (state.loading = value)));
  }

  public get details(): DetailLevel {
    return store.query((state) => state.details);
  }

  public set details(value: DetailLevel) {
    store.update(produce((state) => (state.details = value)));
  }

  public toggle(): void {
    store.update(
      produce((state) => {
        if (state.state === VisualizationState.finished) {
          state.state = VisualizationState.running;
          state.currentTime = startHour;
          state.preloadTime = startHour;
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
        state.preloadTime = startHour;
        state.loading = false;
      })
    );
  }

  public stopSameHour(): void {
    store.update(
      produce((state) => {
        state.state = VisualizationState.stopped;
        state.loading = false;
      })
    );
  }

  public nextHour(): void {
    store.update(produce((state) => state.currentTime++));
  }

  public preloadNextHour(): void {
    store.update(produce((state) => state.preloadTime++));
  }

  public zoomChanged(): void {
    if (store.getValue().state === VisualizationState.running) {
      this.stopSameHour();
      this.start();
    }
  }
}
