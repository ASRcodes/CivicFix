import { useEffect, useState } from 'react';
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
import { adminService } from '../../services/adminService.js';

const KEYS = ['search', 'status', 'category', 'priority', 'department', 'from', 'to', 'sort'];

export default function AdminComplaints() {
  useDocumentTitle('Manage complaints');
  const [filters, setFilters, reset] = useQueryFilters(KEYS, { sort: 'newest' });
  const [search, setSearch] = useState(filters.search || '');
  const debouncedSearch = useDebounce(search);
  const [departments, setDepartments] = useState([]);

  useEffect(() => { adminService.departments().then(setDepartments).catch(() => setDepartments([])); }, []);

  useEffect(() => {
    if ((filters.search || '') !== debouncedSearch) setFilters({ ...filters, search: debouncedSearch, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const query = { ...filters, limit: 15 };
  const { data, loading, error, reload } = useAsync(() => adminService.complaints(query), [JSON.stringify(query)]);
  const complaints = data?.data?.complaints || [];

  return (
    <>
      <PageHeader title="Complaints" subtitle="Search, filter and open any complaint to review, assign or change its status." />
      <SearchFilterBar
        values={{ ...filters, search }}
        onChange={(v) => { if (v.search !== search) setSearch(v.search); else setFilters(v); }}
        onReset={() => { setSearch(''); reset(); }}
        departments={departments}
        show={['search', 'status', 'category', 'priority', 'department', 'dates', 'sort']}
      />
      <div className="cf-card p-3">
        {loading && <LoadingSpinner label="Loading complaints" />}
        <ErrorMessage message={error} onRetry={reload} />
        {!loading && !error && complaints.length === 0 && (
          <EmptyState icon="bi-funnel" title="No complaints match" message="Adjust or clear the filters to see more results." />
        )}
        {!loading && !error && complaints.length > 0 && (
          <>
            <ComplaintTable complaints={complaints} linkBase="/admin/complaints" showCitizen />
            <div className="mt-3"><Pagination meta={data.meta} onPageChange={(page) => setFilters({ ...filters, page })} /></div>
          </>
        )}
      </div>
    </>
  );
}
