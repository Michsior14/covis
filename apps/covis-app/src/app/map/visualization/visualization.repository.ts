import { Injectable } from '@angular/core';
import { DetailLevel } from '@covis/shared';
import { createState, select, Store, withProps } from '@ngneat/elf';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { map } from 'rxjs/operators';
import { produce } from '../../shared/produce';

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
  minTime: number;
  maxTime: number;
  animationSpeed: number;
  loading: boolean;
  needsMoreData: boolean;
  fps: boolean;
  details: DetailLevel;
  preload: number;
}

const initialProps = Object.freeze<VisualizationProps>({
  state: VisualizationState.stopped,
  currentTime: 0,
  preloadTime: 0,
  minTime: 0,
  maxTime: 0,
  animationSpeed: 5000,
  loading: false,
  needsMoreData: false,
  fps: false,
  details: DetailLevel.medium,
  preload: 1,
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

  public minTimeChange = store.pipe(select((state) => state.minTime));

  public maxTimeChange = store.pipe(select((state) => state.maxTime));

  public get hour(): number {
    return store.query((state) => state.currentTime);
  }

  public get preloadHour(): number {
    return store.query((state) => state.preloadTime);
  }

  public get minTime(): number {
    return store.query((state) => state.minTime);
  }

  public get maxTime(): number {
    return store.query((state) => state.maxTime);
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

  public get preload(): number {
    return store.query((state) => state.preload);
  }

  public set preload(value: number) {
    store.update(produce((state) => (state.preload = value)));
  }

  public get needsMoreData(): boolean {
    return store.query((state) => state.needsMoreData);
  }

  public set needsMoreData(value: boolean) {
    store.update(produce((state) => (state.needsMoreData = value)));
  }

  public toggle(): void {
    store.update(
      produce((state) => {
        if (state.state === VisualizationState.finished) {
          state.state = VisualizationState.running;
          state.currentTime = state.minTime;
          state.preloadTime = state.minTime;
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
        state.currentTime = state.minTime;
        state.preloadTime = state.minTime;
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

  public syncPreloadTime(): void {
    store.update(produce((state) => (state.preloadTime = state.currentTime)));
  }

  public zoomChanged(): void {
    const { state, currentTime } = store.getValue();
    if (state === VisualizationState.running) {
      this.setTime(currentTime);
    }
  }

  public setTime(value: number) {
    this.stopSameHour();
    store.update(
      produce((state) => {
        state.currentTime = value;
        state.preloadTime = value;
      })
    );
    this.start();
  }

  public setMinMaxTime(minTime: number, maxTime: number): void {
    store.update(
      produce((state) => {
        state.minTime = minTime;
        state.maxTime = maxTime;

        if (state.currentTime < minTime || state.currentTime > maxTime) {
          state.currentTime = minTime;
          state.preloadTime = minTime;
        }
      })
    );
  }
}
