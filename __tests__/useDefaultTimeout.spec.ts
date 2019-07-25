import { renderHook } from '@testing-library/react-hooks';
import useDefaultTimeout from '../src';

jest.useFakeTimers();

afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
})

describe('useTimeout with default TimeoutHandler', () => {
  it('should be defined', () => {
    expect(useDefaultTimeout).toBeDefined();
  });

  it('should execute a callback after the specified timeout, which must not leak', () => {
    const callbackProp = jest.fn();
    const timeoutProp = 1000;
    const { unmount } = renderHook(({ callback, timeout, deps }) => (
      useDefaultTimeout(callback, timeout, deps)
    ), {
      initialProps: {
        callback: callbackProp,
        timeout: timeoutProp,
        deps: [timeoutProp],
      },
    });

    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledWith(callbackProp, 1000);
    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(clearTimeout).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(1500);

    expect(callbackProp).toHaveBeenCalledTimes(1);
    expect(clearTimeout).toHaveBeenCalledTimes(0);
    unmount();
    expect(clearTimeout).toHaveBeenCalledTimes(1);
  });

  it('should clear the timeout early if cancelTimeout is called', () => {
    const callbackProp = jest.fn();
    const timeoutProp = 1000;
    const { result, unmount } = renderHook(({ callback, timeout, deps }) => (
      useDefaultTimeout(callback, timeout, deps)
    ), {
      initialProps: {
        callback: callbackProp,
        timeout: timeoutProp,
        deps: [timeoutProp],
      },
    });
    const { current: cancelTimeout } = result;

    expect(typeof cancelTimeout).toBe('function');

    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledWith(callbackProp, timeoutProp);
    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(clearTimeout).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(495);
    cancelTimeout();
    jest.advanceTimersByTime(5);

    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(clearTimeout).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(timeoutProp);

    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(clearTimeout).toHaveBeenCalledTimes(1);
    unmount();
    expect(clearTimeout).toHaveBeenCalledTimes(2);
  });

  it('should not execute the original callback if the callback property changes before the old timeout expires', () => {
    const callbackProp = jest.fn();
    const timeoutProp = 1000;
    const { rerender, unmount } = renderHook(({ callback, timeout, deps }) => (
      useDefaultTimeout(callback, timeout, deps)
    ), {
      initialProps: {
        callback: callbackProp,
        timeout: timeoutProp,
        deps: [timeoutProp, callbackProp],
      },
    });

    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledWith(callbackProp, timeoutProp);
    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(clearTimeout).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(500);

    const newCallbackProp = jest.fn();
    rerender({
      callback: newCallbackProp,
      timeout: timeoutProp,
      deps: [timeoutProp, newCallbackProp],
    });

    jest.advanceTimersByTime(750);

    expect(clearTimeout).toHaveBeenCalledTimes(1);
    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(newCallbackProp).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(timeoutProp);

    expect(setTimeout).toHaveBeenCalledTimes(2);
    expect(clearTimeout).toHaveBeenCalledTimes(1);
    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(newCallbackProp).toHaveBeenCalledTimes(1);
    unmount();
    expect(clearTimeout).toHaveBeenCalledTimes(2);
  });

  it(`should delay the callback if the timeout property changes before the old timeout expires
  and if the timeout was originally added to the hook dependencies`, () => {
    const callbackProp = jest.fn();
    const timeoutProp = 1000;
    const { rerender, unmount } = renderHook(({ callback, timeout, deps }) => (
      useDefaultTimeout(callback, timeout, deps)
    ), {
      initialProps: {
        callback: callbackProp,
        timeout: timeoutProp,
        deps: [timeoutProp],
      },
    });

    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledWith(callbackProp, timeoutProp);
    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(clearTimeout).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(500);

    const newTimeoutProp = 3000;
    rerender({
      callback: callbackProp,
      timeout: newTimeoutProp,
      deps: [newTimeoutProp],
    });

    expect(setTimeout).toHaveBeenCalledTimes(2);
    expect(setTimeout).toHaveBeenCalledWith(callbackProp, newTimeoutProp);
    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(clearTimeout).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);

    expect(callbackProp).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(newTimeoutProp);

    expect(setTimeout).toHaveBeenCalledTimes(2);
    expect(clearTimeout).toHaveBeenCalledTimes(1);
    expect(callbackProp).toHaveBeenCalledTimes(1);
    unmount();
    expect(clearTimeout).toHaveBeenCalledTimes(2);
  });

  it('if no dependencies is passed, it should not reset the counter, even if some property changed', () => {
    const callbackProp = jest.fn();
    const timeoutProp = 1000;
    const { rerender, unmount } = renderHook(({ callback, timeout, deps }) => (
      useDefaultTimeout(callback, timeout, deps)
    ), {
      initialProps: {
        callback: callbackProp,
        timeout: timeoutProp,
        deps: undefined,
      },
    });

    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledWith(callbackProp, timeoutProp);
    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(clearTimeout).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(500);

    const newTimeoutProp = 3000;
    rerender({
      callback: callbackProp,
      timeout: newTimeoutProp,
      deps: undefined,
    });

    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledWith(callbackProp, timeoutProp);
    expect(callbackProp).toHaveBeenCalledTimes(0);
    expect(clearTimeout).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(1000);

    expect(callbackProp).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(clearTimeout).toHaveBeenCalledTimes(0);
    unmount();
    expect(clearTimeout).toHaveBeenCalledTimes(1);
  });
});
