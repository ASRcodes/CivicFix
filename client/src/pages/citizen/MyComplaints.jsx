import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import SearchFilterBar from '../../components/SearchFilterBar.jsx';
import ComplaintTable from '../../components/ComplaintTable.jsx';
import Pagination from '../../components/Pagination.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useQueryFilters } from '../../hooks/useQueryFilters.js';
import { complaintService } from '../../services/complaintService.js';

const KEYS = ['search', 'status', 'category', 'from', 'to', 'sort'];

export default function MyComplaints() {
  useDocumentTitle('My complaints');
  const [filters, setFilters, reset] = useQueryFilters(KEYS, { sort: 'newest' });
  const [search, setSearch] = useState(filters.search || '');
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    if ((filters.search || '') !== debouncedSearch) setFilters({ ...filters, search: debouncedSearch, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const query = { ...filters, limit: 10 };
  const { data, loading, error, reload } = useAsync(() => complaintService.list(query), [JSON.stringify(query)]);
  const complaints = data?.data?.complaints || [];
  const hasFilters = KEYS.some((k) => k !== 'sort' && filters[k]);

  return (
    <>
      <PageHeader
        title="My complaints"
        subtitle="Everything you have reported, with its current status."
        actions={<Link to="/dashboard/complaints/new" className="btn btn-teal"><i className="bi bi-plus-lg me-1" />Report an issue</Link>}
      />
      <SearchFilterBar
        values={{ ...filters, search }}
        onChange={(v) => { if (v.search !== search) setSearch(v.search); else setFilters(v); }}
        onReset={() => { setSearch(''); reset(); }}
        show={['search', 'status', 'category', 'dates', 'sort']}
      />
      <div className="cf-card p-3">
        {loading && <LoadingSpinner label="Loading complaints" />}
        <ErrorMessage message={error} onRetry={reload} />
        {!loading && !error && complaints.length === 0 && (
          hasFilters
            ? <EmptyState icon="bi-funnel" title="No complaints match these filters" message="Try a different status, category or date range." action={<button type="button" className="btn btn-light" onClick={() => { setSearch(''); reset(); }}>Clear filters</button>} />
            : <EmptyState icon="bi-megaphone" title="No complaints yet" message="When you report an issue it will appear here with its reference number." action={<Link to="/dashboard/complaints/new" className="btn btn-teal">Report an issue</Link>} />
        )}
        {!loading && !error && complaints.length > 0 && (
          <>
            <ComplaintTable complaints={complaints} linkBase="/dashboard/complaints" />
            <div className="mt-3"><Pagination meta={data.meta} onPageChange={(page) => setFilters({ ...filters, page })} /></div>
          </>
        )}
      </div>
    </>
  );
}
