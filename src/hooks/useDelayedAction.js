import { useCallback, useEffect, useRef, useState } from "react";

export default function useDelayedAction(delay = 700) {
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(
    () => () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const execute = useCallback(
    (callback) => {
      setIsLoading(true);
      timerRef.current = window.setTimeout(() => {
        setIsLoading(false);
        callback();
      }, delay);
    },
    [delay],
  );

  return { execute, isLoading };
}
