import { Injectable } from '@angular/core';
import { DetailLevel, DiseasePhase } from '@covis/shared';
import { createState, select, Store, withProps } from '@ngneat/elf';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { map } from 'rxjs/operators';
import { produce } from '../../shared/produce';
import { StrategyType } from '../point/point.strategy';

export enum VisualizationState {
  running = 'running',
  paused = 'paused',
  stopped = 'stopped',
  finished = 'finished',
}

export type Filters = Partial<Record<DiseasePhase, true>>;

export interface VisualizationProps {
  state: VisualizationState;
  previousTime: number;
  currentTime: number;
  preloadTime: number;
  minTime: number;
  maxTime: number;
  animationSpeed: number;
  loading: boolean;
  fps: boolean;
  details: DetailLevel;
  preload: number;
  needsRestart: boolean;
  strategy: StrategyType;
  filters: Filters;
}

const initialProps = Object.freeze<VisualizationProps>({
  state: VisualizationState.stopped,
  previousTime: -1,
  currentTime: 0,
  preloadTime: 0,
  minTime: 0,
  maxTime: 0,
  animationSpeed: 5000,
  loading: false,
  fps: false,
  details: DetailLevel.medium,
  preload: 1,
  needsRestart: false,
  strategy: StrategyType.normal,
  filters: {},
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

  public filtersChange = store.pipe(select((state) => state.filters));

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

  public get isDefaultMaxTime(): boolean {
    return store.query((state) => state.maxTime === initialProps.maxTime);
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

  public get previousTime(): number {
    return store.query((state) => state.previousTime);
  }

  public get strategy(): StrategyType {
    return store.query((state) => state.strategy);
  }

  public set strategy(value: StrategyType) {
    store.update(produce((state) => (state.strategy = value)));
  }

  public get filters(): Filters {
    return store.query((state) => state.filters);
  }

  public toggle(): void {
    const { state, needsRestart } = store.getValue();
    if (needsRestart && state === VisualizationState.paused) {
      return this.resetToCurrentTime();
    }

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

  public pause(): void {
    store.update(
      produce((state) => {
        if (state.state === VisualizationState.running) {
          state.state = VisualizationState.paused;
        }
      })
    );
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
    store.update(
      produce((state) => {
        state.previousTime = state.currentTime;
        state.currentTime++;
      })
    );
  }

  public preloadNextHour(): void {
    store.update(produce((state) => state.preloadTime++));
  }

  public syncPreviousTime(): void {
    store.update(
      produce((state) => (state.previousTime = state.currentTime - 1))
    );
  }

  public syncPreloadTime(): void {
    store.update(produce((state) => (state.preloadTime = state.currentTime)));
  }

  public zoomChanged(): void {
    const { state } = store.getValue();
    if (state === VisualizationState.running) {
      this.resetToCurrentTime();
    } else {
      this.needsRestart();
    }
  }

  public setTime(value: number) {
    this.stopSameHour();
    store.update(
      produce((state) => {
        state.state = VisualizationState.running;
        state.currentTime = value;
        state.preloadTime = value;
      })
    );
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

  public needsRestart(): void {
    store.update(produce((state) => (state.needsRestart = true)));
  }

  public toggleFilter(phase: DiseasePhase) {
    store.update(
      produce((state) => {
        if (state.filters[phase]) {
          delete state.filters[phase];
          return;
        }
        state.filters[phase] = true;
      })
    );
  }

  public shouldBeVisible(phase: DiseasePhase): boolean {
    const { filters } = store.getValue();
    const { length } = Object.keys(filters);
    return !length || !!filters[phase];
  }

  private resetToCurrentTime(): void {
    this.setTime(store.getValue().currentTime);
    store.update(produce((state) => (state.needsRestart = false)));
  }
}
