import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

const STAGES = [
  ['Pending', 'The complaint has been received and is waiting for a staff member to review it.'],
  ['Under Review', 'Staff are checking the details and deciding which department is responsible.'],
  ['In Progress', 'The responsible department has scheduled or started the work.'],
  ['Resolved', 'The issue has been fixed. A resolved complaint can be reopened if the problem returns.'],
  ['Rejected', 'The complaint could not be acted on, for example because it is a duplicate. A reason is always given.'],
];

export default function AboutPage() {
  useDocumentTitle('About');
  return (
    <div className="container py-5" style={{ maxWidth: 900 }}>
      <h1 className="h2">About CivicFix</h1>
      <p className="lead text-muted">
        CivicFix connects residents with the municipal teams responsible for keeping streets clean, lit, drained and supplied
        with water. It replaces phone calls and paper forms with a single, trackable record for every complaint.
      </p>

      <h2 className="h4 mt-5">Our mission</h2>
      <p>
        Make it simple for anyone to report a civic problem, make sure every report reaches the right department, and make the
        progress of each complaint visible from submission to resolution.
      </p>

      <h2 className="h4 mt-5">How complaints are processed</h2>
      <ol className="cf-timeline mt-3">
        {STAGES.map(([name, text]) => (
          <li key={name}>
            <span className="cf-timeline-icon" aria-hidden="true"><i className="bi bi-dot" /></span>
            <strong>{name}</strong>
            <p className="text-muted mb-0">{text}</p>
          </li>
        ))}
      </ol>
      <p className="small text-muted">
        Status changes follow fixed rules enforced by the server. A complaint cannot jump straight from Pending to Resolved,
        and every change is recorded with the time and the staff member responsible.
      </p>

      <div className="alert alert-warning mt-5" role="note">
        <strong>Project notice.</strong> CivicFix is a college full-stack development project. It is not connected to any real
        municipal corporation, and the contact details shown on this site are demo placeholders.
      </div>
      <Link to="/report" className="btn btn-teal">Report an issue</Link>
    </div>
  );
}
