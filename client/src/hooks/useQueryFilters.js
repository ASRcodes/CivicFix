import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Keeps list filters in the URL (?status=Pending&page=2) so they survive
 * navigation to a details page and back, and can be bookmarked.
 */
export function useQueryFilters(keys, defaults = {}) {
  const [params, setParams] = useSearchParams();

  const values = useMemo(() => {
    const out = { ...defaults };
    keys.forEach((k) => { const v = params.get(k); if (v !== null) out[k] = v; });
    out.page = Number(params.get('page')) || 1;
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const setValues = useCallback((next) => {
    const clean = {};
    Object.entries(next).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined && !(k === 'page' && Number(v) === 1) && defaults[k] !== v) clean[k] = String(v);
    });
    setParams(clean, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setParams]);

  const reset = useCallback(() => setParams({}, { replace: true }), [setParams]);

  return [values, setValues, reset];
}
