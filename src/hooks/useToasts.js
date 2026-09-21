import { useCallback, useRef, useState } from 'react';

/** Toast queue. Each toast removes itself after 3.6 seconds. */
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'info') => {
      const id = nextId.current++;
      setToasts((list) => [...list, { id, message, type }]);
      setTimeout(() => dismiss(id), 3600);
    },
    [dismiss]
  );

  return { toasts, showToast, dismiss };
}
