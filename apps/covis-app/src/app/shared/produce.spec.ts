import * as immer from 'immer';
import { produce } from './produce';

jest.mock('immer');

describe('produce', () => {
  it('should run immer', () => {
    (immer.produce as unknown as jest.SpyInstance).mockImplementationOnce(
      (state, updater) => updater(state)
    );

    const callback = jest.fn();
    produce((state) => callback(state))({});

    expect(callback).toHaveBeenCalled();
    expect(immer.produce).toHaveBeenCalled();
  });
});
