/**
 * Complaint status workflow, enforced on the server.
 *
 *   Pending ─► Under Review ─► In Progress ─► Resolved
 *     │             │              │  ▲           │
 *     │             │              │  └─ reopen ──┘
 *     │             │              └─► Under Review (sent back for review)
 *     └─────────────┴─► Rejected (final, reason required)
 */
export const TRANSITIONS = Object.freeze({
  Pending: Object.freeze(['Under Review', 'Rejected']),
  'Under Review': Object.freeze(['In Progress', 'Rejected']),
  'In Progress': Object.freeze(['Resolved', 'Under Review']),
  Resolved: Object.freeze(['In Progress']),
  Rejected: Object.freeze([]),
});

export function allowedNextStatuses(current) {
  return TRANSITIONS[current] ? [...TRANSITIONS[current]] : [];
}

export function canTransition(from, to) {
  return allowedNextStatuses(from).includes(to);
}

/** Returns { ok: true } or { ok: false, message }. */
export function validateTransition(from, to, { reason } = {}) {
  if (!Object.prototype.hasOwnProperty.call(TRANSITIONS, to)) {
    return { ok: false, message: `Unknown status "${to}"` };
  }
  if (from === to) {
    return { ok: false, message: `Complaint is already "${to}"` };
  }
  if (!canTransition(from, to)) {
    const next = allowedNextStatuses(from);
    return {
      ok: false,
      message: next.length
        ? `Cannot move a complaint from "${from}" to "${to}". Allowed next statuses: ${next.join(', ')}`
        : `"${from}" is a final status and cannot be changed`,
    };
  }
  if (to === 'Rejected' && (!reason || !String(reason).trim())) {
    return { ok: false, message: 'A reason is required when rejecting a complaint' };
  }
  return { ok: true };
}
