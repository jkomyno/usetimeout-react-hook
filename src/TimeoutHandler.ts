export interface TimeoutHandler<T> {
  /**
   * Timeout function that accepts two parameters:
   * a function and the timeout after which that function is fired.
   * If not provided, the default `timeoutFn` will be `setTimeout`.
   */
  setTimeout: (fn: () => void, timeout: number) => T;

  /**
   * Function that should be used to clear the effects of `timeoutFn` after
   * the component where it is rendered is unmounted.
   */
  clearTimeout: (timeoutFn: T | undefined) => void;
}
