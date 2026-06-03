'use client';

import { useState, useCallback } from 'react';

export function useFetching<T extends unknown[] = []>(
  asyncCallback: (...args: T) => Promise<void>,
): [(...args: T) => Promise<void>, boolean, unknown] {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fetching = useCallback(
    async (...args: T) => {
      try {
        setIsLoading(true);
        await asyncCallback(...args);
      } catch (e) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
    },
    [asyncCallback],
  );

  return [fetching, isLoading, error];
}
