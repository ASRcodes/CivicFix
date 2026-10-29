/** Converts "1d", "12h", "30m" or seconds into milliseconds for the cookie maxAge. */
export function expiresInToMs(value) {
  if (/^\d+$/.test(String(value))) return Number(value) * 1000;
  const match = /^(\d+)([smhd])$/.exec(String(value));
  if (!match) return 24 * 60 * 60 * 1000;
  const unit = { s: 1e3, m: 6e4, h: 36e5, d: 864e5 }[match[2]];
  return Number(match[1]) * unit;
}
