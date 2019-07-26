import { TimeoutHandler } from './TimeoutHandler';

/**
 * defaultTimeoutHandler implements the TimeoutHandler interface with the usual timer
 * functions available in browsers and in React Native, i.e. `setTimeout` and `clearTimeout`.
 */
export const defaultTimeoutHandler: TimeoutHandler<number> = {
  setTimeout: (fn: () => void, timeout: number) => window.setTimeout(fn, timeout),
  clearTimeout: (timeout: number | undefined) => { window.clearTimeout(timeout) },
};
