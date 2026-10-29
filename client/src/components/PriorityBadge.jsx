import { PRIORITY_ICON } from '../utils/constants.js';

export default function PriorityBadge({ priority }) {
  if (!priority) return null;
  return (
    <span className={`cf-priority cf-priority-${priority.toLowerCase()}`}>
      <i className={`bi ${PRIORITY_ICON[priority]}`} aria-hidden="true" />{priority}
    </span>
  );
}
