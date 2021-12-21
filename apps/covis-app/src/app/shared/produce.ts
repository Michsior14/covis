import { produce as produceImmer } from 'immer';

export const produce = <TState>(
  updater: (state: TState) => void
): ((state: TState) => TState) => {
  return (state) => {
    return produceImmer(state, (draft) => {
      updater(draft as TState);
    });
  };
};
