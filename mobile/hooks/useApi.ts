// hooks/useApi.ts
// Generic hook for API calls with loading/error state management

import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T, A extends unknown[]> extends ApiState<T> {
  execute: (...args: A) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T, A extends unknown[] = []>(
  apiFunc: (...args: A) => Promise<T>,
): UseApiReturn<T, A> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: A): Promise<T | null> => {
      setState({ data: null, loading: true, error: null });
      try {
        const result = await apiFunc(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        const message =
          axiosErr.response?.data?.message ??
          axiosErr.message ??
          'Something went wrong';
        setState({ data: null, loading: false, error: message });
        return null;
      }
    },
    [apiFunc],
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
