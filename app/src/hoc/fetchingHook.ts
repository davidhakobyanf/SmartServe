'use client';

import { useState, useCallback, useRef } from 'react';

export function useFetching<T extends unknown[] = []>(
  asyncCallback: (...args: T) => Promise<void>,
): [(...args: T) => Promise<boolean>, boolean, unknown] {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const callbackRef = useRef(asyncCallback);
  callbackRef.current = asyncCallback;

  const fetching = useCallback(
    async (...args: T) => {
      try {
        setIsLoading(true);
        setError(null);
        await callbackRef.current(...args);
        return true;
      } catch (e) {
        setError(e);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return [fetching, isLoading, error];
}
