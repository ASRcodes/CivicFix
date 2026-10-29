/** Formats a complaint reference number, e.g. CF-2026-000042. */
export function formatReference(year, seq) {
  return `CF-${year}-${String(seq).padStart(6, '0')}`;
}

export const REFERENCE_PATTERN = /^CF-\d{4}-\d{6}$/;
