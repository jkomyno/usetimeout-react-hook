import { useTimeout, CancelTimer } from './useTimeout';
import { defaultTimeoutHandler } from './defaultTimeoutHandler';

export type UseTimeoutDefault = (callback: () => void, timeout: number, deps: unknown[]) => CancelTimer;

/**
 * useTimeoutDefault is a React.js custom hook that sets a leak-safe timeout and returns
 * a function to cancel it before the timeout expires.
 * It uses the default timeout handlers, i.e. window.setTimeout and window.clearTimeout.
 * It's composed of two other native hooks, useRef and useEffect.
 * If a new callback is given to the hook before the previous timeout expires,
 * only the new callback will be executed at the moment the timeout expires.
 * When the hook receives a new callback, the timeout isn't reset.
 * 
 * @param callback the function to be executed after the timeout expires
 * @param timeout the number of milliseconds after which the callback should be triggered
 * @param deps useEffect dependencies that should cause the timeout to be reset
 * @return function to cancel the timer before the timeout expires
 */
export const useTimeoutDefault: UseTimeoutDefault = (callback, timeout, deps = []) => (
  useTimeout(callback, timeout, defaultTimeoutHandler, deps)
);
