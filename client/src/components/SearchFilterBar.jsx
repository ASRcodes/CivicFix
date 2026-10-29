import { CATEGORIES, PRIORITIES, SORT_OPTIONS, STATUSES } from '../utils/constants.js';

/**
 * Controlled filter bar. All filtering happens on the server; this component only
 * edits the query values. `show` selects which controls appear.
 */
export default function SearchFilterBar({
  values,
  onChange,
  onReset,
  departments = [],
  show = ['search', 'status', 'category', 'priority', 'dates', 'sort'],
  searchPlaceholder = 'Search reference, title, area…',
}) {
  const set = (key) => (e) => onChange({ ...values, [key]: e.target.value, page: 1 });
  const has = (k) => show.includes(k);
  const active = ['search', 'status', 'category', 'priority', 'department', 'from', 'to'].some((k) => values[k]);

  return (
    <div className="cf-card-flat p-3 mb-3">
      <div className="row g-2 align-items-end">
        {has('search') && (
          <div className="col-12 col-lg-4">
            <label htmlFor="flt-search" className="form-label small mb-1">Search</label>
            <div className="input-group">
              <span className="input-group-text bg-white"><i className="bi bi-search" aria-hidden="true" /></span>
              <input id="flt-search" type="search" className="form-control" placeholder={searchPlaceholder} value={values.search || ''} onChange={set('search')} maxLength={100} />
            </div>
          </div>
        )}
        {has('status') && (
          <div className="col-6 col-md-4 col-lg-2">
            <label htmlFor="flt-status" className="form-label small mb-1">Status</label>
            <select id="flt-status" className="form-select" value={values.status || ''} onChange={set('status')}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        {has('category') && (
          <div className="col-6 col-md-4 col-lg-2">
            <label htmlFor="flt-category" className="form-label small mb-1">Category</label>
            <select id="flt-category" className="form-select" value={values.category || ''} onChange={set('category')}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.value}</option>)}
            </select>
          </div>
        )}
        {has('priority') && (
          <div className="col-6 col-md-4 col-lg-2">
            <label htmlFor="flt-priority" className="form-label small mb-1">Priority</label>
            <select id="flt-priority" className="form-select" value={values.priority || ''} onChange={set('priority')}>
              <option value="">All priorities</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}
        {has('department') && (
          <div className="col-6 col-md-4 col-lg-2">
            <label htmlFor="flt-department" className="form-label small mb-1">Department</label>
            <select id="flt-department" className="form-select" value={values.department || ''} onChange={set('department')}>
              <option value="">All departments</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
        )}
        {has('dates') && (
          <>
            <div className="col-6 col-md-4 col-lg-2">
              <label htmlFor="flt-from" className="form-label small mb-1">From</label>
              <input id="flt-from" type="date" className="form-control" value={values.from || ''} max={values.to || undefined} onChange={set('from')} />
            </div>
            <div className="col-6 col-md-4 col-lg-2">
              <label htmlFor="flt-to" className="form-label small mb-1">To</label>
              <input id="flt-to" type="date" className="form-control" value={values.to || ''} min={values.from || undefined} onChange={set('to')} />
            </div>
          </>
        )}
        {has('sort') && (
          <div className="col-6 col-md-4 col-lg-2">
            <label htmlFor="flt-sort" className="form-label small mb-1">Sort by</label>
            <select id="flt-sort" className="form-select" value={values.sort || 'newest'} onChange={set('sort')}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )}
        {onReset && (
          <div className="col-6 col-md-4 col-lg-auto">
            <button type="button" className="btn btn-light w-100" onClick={onReset} disabled={!active}>
              <i className="bi bi-x-circle me-1" />Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
