export const ROLES = Object.freeze({ CITIZEN: 'citizen', ADMIN: 'admin' });

export const STATUSES = Object.freeze(['Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected']);

export const CATEGORIES = Object.freeze([
  'Garbage',
  'Roads & Potholes',
  'Streetlights',
  'Water Supply',
  'Drainage & Sewage',
  'Sanitation',
  'Other',
]);

export const PRIORITIES = Object.freeze(['Low', 'Medium', 'High', 'Urgent']);

/** Numeric weights so priority sorts by severity rather than alphabetically. */
export const PRIORITY_WEIGHT = Object.freeze({ Low: 1, Medium: 2, High: 3, Urgent: 4 });

export const ACTIVITY_ACTIONS = Object.freeze({
  CREATED: 'CREATED',
  EDITED: 'EDITED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  ASSIGNED: 'ASSIGNED',
  PUBLIC_UPDATE: 'PUBLIC_UPDATE',
  CITIZEN_COMMENT: 'CITIZEN_COMMENT',
  INTERNAL_NOTE: 'INTERNAL_NOTE',
});

export const ALLOWED_IMAGE_TYPES = Object.freeze({
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
});
