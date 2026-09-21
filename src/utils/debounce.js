/**
 * [ASYNC PATTERN 1] CALLBACK-BASED DEBOUNCE
 * Takes a callback and a delay, returns a wrapped function. Each call clears
 * the pending timer and starts a new one, so the callback runs once the user
 * stops typing for `delay` ms. Plain setTimeout/clearTimeout, no promises.
 */
export function debounce(callback, delay) {
  let timerId = null;

  function debounced(...args) {
    if (timerId !== null) {
      clearTimeout(timerId); // the earlier keystroke is cancelled here
    }
    timerId = setTimeout(() => {
      timerId = null;
      callback(...args); // the callback finally fires
    }, delay);
  }

  // Lets a React effect cleanup stop a pending call on unmount.
  debounced.cancel = function cancel() {
    if (timerId !== null) clearTimeout(timerId);
    timerId = null;
  };

  return debounced;
}
