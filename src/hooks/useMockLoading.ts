import { useEffect, useState } from "react";

/** Simulates the network latency used by the static demo without coupling pages to timers. */
export function useMockLoading(delay = 360): boolean {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsLoading(false), delay);
    return () => window.clearTimeout(timeout);
  }, [delay]);

  return isLoading;
}
