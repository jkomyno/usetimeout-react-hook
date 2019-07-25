import { renderHook } from '@testing-library/react-hooks';
import { useTimeout, TimeoutHandler } from '../src';

jest.useFakeTimers();

let timeoutHandler: TimeoutHandler<number>;
let setTimeoutSpy: jest.Mock<number, [TimerHandler, number?, ...any[]]>;
let clearTimeoutSpy: jest.Mock<void, [number?]>;

afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();

  setTimeoutSpy = jest.fn(window.setTimeout);
  clearTimeoutSpy = jest.fn(window.clearTimeout);
  timeoutHandler = {
    setTimeout: (fn: () => void, timeout: number) => setTimeoutSpy(fn, timeout),
    clearTimeout: (timeoutFn: number | undefined) => { clearTimeoutSpy(timeoutFn) },
  };
})

describe('useTimeout with custom TimeoutHandler', () => {
  it('should be defined', () => {
    expect(useTimeout).toBeDefined();
  });

  it('should execute a callback after the specified timeout, which must not leak', () => {
    const callbackProp = jest.fn();
    const timeoutProp = 1000;
    const { unmount } = renderHook(({ callback, timeout, deps }) => (
      useTimeout(callback, timeout, timeoutHandler, deps)
    ), {
      initialProps: {
        callback: callbackProp,
        timeout: timeoutProp,
        deps: [timeoutProp],
      },
    });

    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).toHaveBeenCalledWith(callbackProp, 1000);
    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(1500);

    expect(callbackProp).toHaveBeenCalledTimes(1);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(0);
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
  });

  it('should clear the timeout early if cancelTimeout is called', () => {
    const callbackProp = jest.fn();
    const timeoutProp = 1000;
    const { result, unmount } = renderHook(({ callback, timeout, deps }) => (
      useTimeout(callback, timeout, timeoutHandler, deps)
    ), {
      initialProps: {
        callback: callbackProp,
        timeout: timeoutProp,
        deps: [timeoutProp],
      },
    });
    const { current: cancelTimeout } = result;

    expect(typeof cancelTimeout).toBe('function');

    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).toHaveBeenCalledWith(callbackProp, timeoutProp);
    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(495);
    cancelTimeout();
    jest.advanceTimersByTime(5);

    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(timeoutProp);

    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
  });

  it('should not execute the original callback if the callback property changes before the old timeout expires', () => {
    const callbackProp = jest.fn();
    const timeoutProp = 1000;
    const { rerender, unmount } = renderHook(({ callback, timeout, deps }) => (
      useTimeout(callback, timeout, timeoutHandler, deps)
    ), {
      initialProps: {
        callback: callbackProp,
        timeout: timeoutProp,
        deps: [timeoutProp, callbackProp],
      },
    });

    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).toHaveBeenCalledWith(callbackProp, timeoutProp);
    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(500);

    const newCallbackProp = jest.fn();
    rerender({
      callback: newCallbackProp,
      timeout: timeoutProp,
      deps: [timeoutProp, newCallbackProp],
    });

    jest.advanceTimersByTime(750);

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(newCallbackProp).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(timeoutProp);

    expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(newCallbackProp).toHaveBeenCalledTimes(1);
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
  });

  it(`should delay the callback if the timeout property changes before the old timeout expires
  and if the timeout was originally added to the hook dependencies`, () => {
    const callbackProp = jest.fn();
    const timeoutProp = 1000;
    const { rerender, unmount } = renderHook(({ callback, timeout, deps }) => (
      useTimeout(callback, timeout, timeoutHandler, deps)
    ), {
      initialProps: {
        callback: callbackProp,
        timeout: timeoutProp,
        deps: [timeoutProp],
      },
    });

    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).toHaveBeenCalledWith(callbackProp, timeoutProp);
    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(500);

    const newTimeoutProp = 3000;
    rerender({
      callback: callbackProp,
      timeout: newTimeoutProp,
      deps: [newTimeoutProp],
    });

    expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
    expect(setTimeoutSpy).toHaveBeenCalledWith(callbackProp, newTimeoutProp);
    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);

    expect(callbackProp).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(newTimeoutProp);

    expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(callbackProp).toHaveBeenCalledTimes(1);
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
  });

  it('if no dependencies is passed, it should not reset the counter, even if some property changed', () => {
    const callbackProp = jest.fn();
    const timeoutProp = 1000;
    const { rerender, unmount } = renderHook(({ callback, timeout, deps }) => (
      useTimeout(callback, timeout, timeoutHandler, deps)
    ), {
      initialProps: {
        callback: callbackProp,
        timeout: timeoutProp,
        deps: undefined,
      },
    });

    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).toHaveBeenCalledWith(callbackProp, timeoutProp);
    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(500);

    const newTimeoutProp = 3000;
    rerender({
      callback: callbackProp,
      timeout: newTimeoutProp,
      deps: undefined,
    });

    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).toHaveBeenCalledWith(callbackProp, timeoutProp);
    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(1000);

    expect(callbackProp).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(0);
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
  });
});
