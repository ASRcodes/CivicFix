export const CATEGORIES = [
  { value: 'Garbage', icon: 'bi-trash3', blurb: 'Uncollected waste, overflowing bins, open dumping.' },
  { value: 'Roads & Potholes', icon: 'bi-cone-striped', blurb: 'Potholes, broken footpaths, debris on roads.' },
  { value: 'Streetlights', icon: 'bi-lightbulb', blurb: 'Lights out, flickering poles, exposed wiring.' },
  { value: 'Water Supply', icon: 'bi-droplet', blurb: 'No supply, leaks, low pressure, dirty water.' },
  { value: 'Drainage & Sewage', icon: 'bi-water', blurb: 'Blocked drains, overflow, waterlogging.' },
  { value: 'Sanitation', icon: 'bi-bucket', blurb: 'Public toilets, dead animals, unhygienic spots.' },
  { value: 'Other', icon: 'bi-three-dots', blurb: 'Fallen trees, public spaces, anything else.' },
];

export const CATEGORY_ICON = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.icon]));

export const STATUSES = ['Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];

export const STATUS_ICON = {
  Pending: 'bi-hourglass-split',
  'Under Review': 'bi-search',
  'In Progress': 'bi-tools',
  Resolved: 'bi-check2-circle',
  Rejected: 'bi-x-circle',
};

export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export const PRIORITY_ICON = {
  Low: 'bi-chevron-down',
  Medium: 'bi-dash-lg',
  High: 'bi-chevron-up',
  Urgent: 'bi-exclamation-triangle-fill',
};

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'priority', label: 'Priority: high to low' },
  { value: 'priority_asc', label: 'Priority: low to high' },
  { value: 'updated', label: 'Recently updated' },
];

export const ACTION_LABEL = {
  CREATED: 'Complaint submitted',
  EDITED: 'Details edited',
  STATUS_CHANGED: 'Status changed',
  ASSIGNED: 'Assignment updated',
  PUBLIC_UPDATE: 'Update from CivicFix staff',
  CITIZEN_COMMENT: 'Comment from citizen',
  INTERNAL_NOTE: 'Internal note',
};

export const MAX_IMAGE_MB = 2;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
