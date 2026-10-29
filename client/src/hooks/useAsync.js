import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../services/api.js';

/**
 * Runs an async loader whenever deps change.
 * Returns { data, loading, error, reload, setData }. Stale responses are ignored,
 * and loading always ends (success or failure), so spinners never hang.
 */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const requestId = useRef(0);

  const run = useCallback(async () => {
    requestId.current += 1;
    const id = requestId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await loader();
      if (id === requestId.current) setState({ data, loading: false, error: null });
    } catch (err) {
      if (id === requestId.current) setState((s) => ({ ...s, loading: false, error: getErrorMessage(err), status: err.response?.status }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);

  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));
  }, []);

  return { ...state, reload: run, setData };
}
