import { useEffect, useState, type DependencyList } from "react";
import type { Unsubscribe } from "../types";

export function useRealtimeValue<T>(
  initialValue: T,
  subscribe: (onValue: (value: T) => void) => Unsubscribe,
  deps: DependencyList,
): T {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    return subscribe(setValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return value;
}
