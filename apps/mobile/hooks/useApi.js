// hooks/useApi.js
// Generic hook for API calls with loading/error state management

import { useState, useCallback } from 'react';

export function useApi(apiFunc) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args) => {
      setState({ data: null, loading: true, error: null });
      try {
        const result = await apiFunc(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const message =
          err.response?.data?.message ??
          err.message ??
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
