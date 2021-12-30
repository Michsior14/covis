import { PausableTimer } from './timer';

describe('PausableTimer', () => {
  jest.useFakeTimers();
  const timeout = 100;
  const callback = jest.fn();

  beforeEach(() => {
    jest.clearAllTimers();
    callback.mockClear().mockReturnValue(Promise.resolve());
  });

  it('should resolve after delay', () => {
    new PausableTimer(callback, timeout);

    jest.advanceTimersByTime(timeout - 1);
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(2);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should pause and resume', () => {
    const timer = new PausableTimer(callback, timeout);

    timer.pause();
    jest.advanceTimersByTime(timeout + 1);
    expect(callback).not.toHaveBeenCalled();

    timer.resume();
    jest.advanceTimersByTime(timeout + 1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should do noting on double resume', () => {
    const timer = new PausableTimer(callback, timeout);

    timer.resume();
    jest.advanceTimersByTime(1);
    expect(callback).not.toHaveBeenCalled();

    timer.resume();
    jest.advanceTimersByTime(timeout + 1);
    expect(callback).toHaveBeenCalledTimes(1);

    timer.resume();
    jest.advanceTimersByTime(timeout + 1);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
