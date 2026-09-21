import { useCallback, useRef, useState } from 'react';

/**
 * A Set of ids with work in flight.
 * The ref gives a synchronous check, so a fast double click sees the id
 * before React re-renders. The counter forces the re-render that disables
 * the matching buttons.
 */
export function useBusySet() {
  const ref = useRef(new Set());
  const [, setVersion] = useState(0);

  const add = useCallback((id) => {
    ref.current.add(String(id));
    setVersion((v) => v + 1);
  }, []);

  const remove = useCallback((id) => {
    ref.current.delete(String(id));
    setVersion((v) => v + 1);
  }, []);

  const has = useCallback((id) => ref.current.has(String(id)), []);

  return { add, remove, has };
}
