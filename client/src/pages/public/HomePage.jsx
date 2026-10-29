import { Link } from 'react-router-dom';
import ComplaintCard from '../../components/ComplaintCard.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { publicService } from '../../services/publicService.js';
import { CATEGORIES } from '../../utils/constants.js';

const EXAMPLE_STEPS = [
  { status: 'Pending', note: 'Submitted with photo and location', state: 'done' },
  { status: 'Under Review', note: 'Verified by the ward office', state: 'done' },
  { status: 'In Progress', note: 'Assigned to Electricity and Streetlights', state: 'current' },
  { status: 'Resolved', note: 'You are notified on your dashboard', state: '' },
];

function ExampleReceipt() {
  return (
    <div className="cf-receipt" aria-label="Example of a complaint tracking receipt">
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <div className="small text-muted">Example complaint</div>
          <div className="cf-receipt-ref">CF-2026-000214</div>
        </div>
        <span className="cf-badge cf-status-in-progress">In Progress</span>
      </div>
      <div className="fw-semibold mt-2">Streetlight out on Lane 3</div>
      <div className="small text-muted"><i className="bi bi-geo-alt me-1" />Lakeview Colony</div>
      <div className="cf-receipt-cut" />
      <ol className="cf-steps">
        {EXAMPLE_STEPS.map((s) => (
          <li key={s.status} className={s.state}>
            <span className="cf-step-dot">{s.state === 'done' && <i className="bi bi-check-lg" />}</span>
            <div><strong className="d-block small">{s.status}</strong><span className="small text-muted">{s.note}</span></div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Stats() {
  const { data, loading, error } = useAsync(() => publicService.stats(), []);
  if (loading) return <LoadingSpinner label="Loading live statistics" />;
  if (error || !data) {
    return <p className="text-muted text-center mb-0">Live statistics are unavailable right now.</p>;
  }
  const items = [
    { value: data.total, label: 'complaints reported' },
    { value: data.resolved, label: 'issues resolved' },
    { value: `${data.resolutionRate}%`, label: 'resolution rate' },
    { value: data.averageResolutionDays ?? '—', label: 'average days to resolve' },
  ];
  return (
    <div className="row g-3 text-center">
      {items.map((i) => (
        <div className="col-6 col-lg-3" key={i.label}>
          <div className="cf-card p-3 h-100">
            <div className="cf-stat-value">{i.value}</div>
            <div className="small text-muted">{i.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentComplaints() {
  const { data, loading, error, reload } = useAsync(() => publicService.recent(6), []);
  if (loading) return <LoadingSpinner label="Loading recent reports" />;
  if (error) {
    return (
      <div className="text-center text-muted">
        Recent reports could not be loaded. <button type="button" className="btn btn-link p-0 align-baseline" onClick={reload}>Try again</button>
      </div>
    );
  }
  if (!data?.length) return <p className="text-muted text-center">No reports yet. Yours could be the first.</p>;
  return (
    <div className="row g-3">
      {data.map((c) => <div className="col-md-6 col-lg-4" key={c.referenceNumber}><ComplaintCard complaint={c} /></div>)}
    </div>
  );
}

export default function HomePage() {
  useDocumentTitle('');
  return (
    <>
      <section className="cf-hero">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <p className="cf-tagline mb-3">Your City. Your Voice. Our Responsibility.</p>
              <h1 className="mb-3">Report a civic problem. Follow it until it is fixed.</h1>
              <p className="lead mb-4">
                Potholes, broken streetlights, garbage, water and drainage problems: send them to the right
                municipal team with a photo and location, and see every step taken on your complaint.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/report" className="btn btn-teal btn-lg"><i className="bi bi-megaphone me-2" />Report an issue</Link>
                <Link to="/track" className="btn btn-outline-light btn-lg">Track a complaint</Link>
              </div>
            </div>
            <div className="col-lg-6">
              <ExampleReceipt />
            </div>
          </div>
        </div>
      </section>

      <section className="cf-section" aria-labelledby="categories-heading">
        <div className="container">
          <h2 id="categories-heading" className="h3 mb-1">What you can report</h2>
          <p className="text-muted mb-4">Choose the category that fits best. Staff can re-route a complaint if needed.</p>
          <div className="row g-3">
            {CATEGORIES.map((c) => (
              <div className="col-sm-6 col-lg-3" key={c.value}>
                <div className="cf-card cf-category">
                  <span className="cf-category-icon" aria-hidden="true"><i className={`bi ${c.icon}`} /></span>
                  <div><h3 className="h6 mb-1">{c.value}</h3><p className="small text-muted mb-0">{c.blurb}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cf-section cf-section-alt" aria-labelledby="how-heading">
        <div className="container">
          <h2 id="how-heading" className="h3 mb-4">How it works</h2>
          <div className="row g-4">
            {[
              ['Report', 'Describe the problem, add the address and an optional photo. You get a reference number straight away.'],
              ['Review', 'Municipal staff verify the complaint and assign it to the responsible department.'],
              ['Action', 'The field team works on it. Every status change and update appears on your timeline.'],
              ['Resolved', 'You see when the issue is fixed and can read the final note from the team.'],
            ].map(([title, text], i) => (
              <div className="col-sm-6 col-lg-3" key={title}>
                <div className="d-flex gap-3">
                  <span className="cf-step-num flex-shrink-0">{i + 1}</span>
                  <div><h3 className="h6 mb-1">{title}</h3><p className="small text-muted mb-0">{text}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cf-section" aria-labelledby="stats-heading">
        <div className="container">
          <h2 id="stats-heading" className="h3 mb-1">Live from the platform</h2>
          <p className="text-muted mb-4">Calculated from the complaint database, not hand-entered figures.</p>
          <Stats />
        </div>
      </section>

      <section className="cf-section cf-section-alt" aria-labelledby="recent-heading">
        <div className="container">
          <div className="d-flex justify-content-between align-items-end mb-4 gap-3">
            <div>
              <h2 id="recent-heading" className="h3 mb-1">Recently reported</h2>
              <p className="text-muted mb-0">Names, street addresses and descriptions are never shown publicly.</p>
            </div>
          </div>
          <RecentComplaints />
        </div>
      </section>

      <section className="cf-section" aria-labelledby="why-heading">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-lg-5">
              <h2 id="why-heading" className="h3">Transparent by design</h2>
              <p className="text-muted">
                Every complaint keeps a permanent history: who changed its status, when, and why. Rejections always
                come with a reason, so nothing disappears without explanation.
              </p>
              <Link to="/register" className="btn btn-primary">Create a free account</Link>
            </div>
            <div className="col-lg-7">
              <div className="row g-3">
                {[
                  ['bi-clock-history', 'Full status history', 'Each change is recorded with a timestamp and the responsible team.'],
                  ['bi-shield-lock', 'Private by default', 'Your contact details are visible only to municipal staff.'],
                  ['bi-diagram-3', 'Routed to the right team', 'Complaints are assigned to the department that can fix them.'],
                  ['bi-search', 'Track without logging in', 'Anyone with the reference number can check progress.'],
                ].map(([icon, title, text]) => (
                  <div className="col-sm-6" key={title}>
                    <div className="cf-card-flat p-3 h-100">
                      <i className={`bi ${icon} fs-4`} style={{ color: 'var(--cf-teal)' }} aria-hidden="true" />
                      <h3 className="h6 mt-2 mb-1">{title}</h3>
                      <p className="small text-muted mb-0">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
