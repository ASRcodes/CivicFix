import { statusClass } from '../utils/format.js';

export default function StatusBadge({ status }) {
  return <span className={`cf-badge ${statusClass(status)}`}>{status}</span>;
}
