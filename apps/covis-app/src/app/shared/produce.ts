import { produce as produceImmer } from 'immer';

/**
 * Wrapper around immer producer.
 *
 * @param updater The function that mutates the state.
 */
export const produce = <TState>(
  updater: (state: TState) => void
): ((state: TState) => TState) => {
  return (state) => {
    return produceImmer(state, (draft) => {
      updater(draft as TState);
    });
  };
};
