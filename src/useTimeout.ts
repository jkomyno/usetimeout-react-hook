import { useEffect, useRef, useCallback } from 'react';
import { TimeoutHandler } from './TimeoutHandler';

export type CancelTimer = () => void;
export type UseTimeout = <T>(callback: () => void, timeout: number, timeHandler: TimeoutHandler<T>, deps?: unknown[]) => CancelTimer;

/**
 * useTimeout is a React.js custom hook that sets a leak-safe timeout and returns
 * a function to cancel it before the timeout expires.
 * It's composed of two other native hooks, useRef and useEffect.
 * It requires a custom way of setting a timeout and clearing it, expressed as an implementation
 * of the generic TimeoutHandler<T> interface.
 * The timer is restarted every time an item in `deps` changes.
 * If a new callback is given to the hook before the previous timeout expires,
 * only the new callback will be executed at the moment the timeout expires.
 * When the hook receives a new callback, the timeout isn't reset.
 * 
 * @param callback the function to be executed after the timeout expires
 * @param timeout the number of milliseconds after which the callback should be triggered
 * @param timeHandler TimeoutHandler instance that's used to set and clear the timeout
 * @param deps useEffect dependencies that should cause the timeout to be reset
 * @return function to cancel the timer before the timeout expires
 */
export const useTimeout: UseTimeout = (callback, timeout, timeHandler, deps = []) => {
  const refCallback = useRef<() => void>();
  const refTimer = useRef<(typeof timeHandler) extends TimeoutHandler<infer R> ? R : never | undefined>();

  useEffect(() => {
    refCallback.current = callback;
  }, [callback]);

  /**
   * The timer is restarted every time an item in `deps` changes.
   * 
   * TODO: The `react-hooks/exhaustive-deps` ESLint warning is disabled due to the fact that
   * the linter isn't able to detect misused `useEffect` dependencies when given a computed
   * array (such as `deps`). If possible, another solution that doesn't block the linter
   * should be used.
   */
  useEffect(() => {
    const timerID = timeHandler.setTimeout(refCallback.current!, timeout);
    refTimer.current = timerID;

    // cleans the timer identified by timerID when the effect is unmounted.
    return () => timeHandler.clearTimeout(timerID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  /**
   * Returns a function that can be used to cancel the current timeout.
   * It does so using `timeHandler.clearTimeout` without exposing the last
   * reference to the timer to the user.
   */
  const cancelTimer = useCallback(() => {
    return timeHandler.clearTimeout(refTimer.current);
  }, [timeHandler])

  return cancelTimer;
}
