export interface TimeoutHandler<T> {
  /**
   * Timeout function that accepts two parameters:
   * a function and the timeout after which that function is fired.
   * If not provided, the default `setTimeout` implementation will be
   * the standard `window.setTimeout`.
   */
  setTimeout: (fn: () => void, timeout: number) => T;

  /**
   * Function that should be used to clear the effects of `setTimeout` after
   * the component where it is rendered is unmounted.
   * If not provided, the default `clearTimeout` implementation will be
   * the standard `window.clearTimeout`.
   */
  clearTimeout: (timeout: T | undefined) => void;
}
