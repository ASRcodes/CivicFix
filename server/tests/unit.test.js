/**
 * Unit tests for pure logic. These need no database and no network.
 * Run: npm run test:unit
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedNextStatuses, canTransition, validateTransition } from '../src/services/statusWorkflow.js';
import { buildComplaintFilter, buildSort, escapeRegex, getPagination, pick } from '../src/utils/query.js';
import { formatReference, REFERENCE_PATTERN } from '../src/utils/reference.js';
import { stripDangerousKeys } from '../src/utils/sanitize.js';
import { expiresInToMs } from '../src/utils/time.js';
import { matchesSignature } from '../src/services/fileService.js';
import { STATUSES } from '../src/utils/constants.js';

test('status workflow: allowed transitions', () => {
  assert.ok(canTransition('Pending', 'Under Review'));
  assert.ok(canTransition('Under Review', 'In Progress'));
  assert.ok(canTransition('In Progress', 'Resolved'));
  assert.ok(canTransition('Resolved', 'In Progress'), 'resolved complaints can be reopened');
  assert.ok(canTransition('Pending', 'Rejected'));
});

test('status workflow: invalid transitions are refused', () => {
  assert.equal(canTransition('Pending', 'Resolved'), false);
  assert.equal(canTransition('Pending', 'In Progress'), false);
  assert.equal(canTransition('Rejected', 'Pending'), false);
  assert.deepEqual(allowedNextStatuses('Rejected'), []);
  const r = validateTransition('Pending', 'Resolved');
  assert.equal(r.ok, false);
  assert.match(r.message, /Allowed next statuses/);
});

test('status workflow: same status, unknown status and rejection reason', () => {
  assert.equal(validateTransition('Pending', 'Pending').ok, false);
  assert.equal(validateTransition('Pending', 'Closed').ok, false);
  assert.equal(validateTransition('Pending', 'Rejected').ok, false, 'reason required');
  assert.equal(validateTransition('Pending', 'Rejected', { reason: '  ' }).ok, false);
  assert.equal(validateTransition('Pending', 'Rejected', { reason: 'Duplicate' }).ok, true);
});

test('every status has a transition entry', () => {
  for (const s of STATUSES) assert.ok(Array.isArray(allowedNextStatuses(s)));
});

test('reference numbers are zero-padded and match the public pattern', () => {
  assert.equal(formatReference(2026, 42), 'CF-2026-000042');
  assert.match(formatReference(2026, 123456), REFERENCE_PATTERN);
});

test('pagination clamps values', () => {
  assert.deepEqual(getPagination({}), { page: 1, limit: 10, skip: 0 });
  assert.deepEqual(getPagination({ page: '3', limit: '5' }), { page: 3, limit: 5, skip: 10 });
  assert.equal(getPagination({ limit: '9999' }).limit, 50);
  assert.equal(getPagination({ page: '-4' }).page, 1);
  assert.equal(getPagination({ page: { $gt: 1 } }).page, 1);
});

test('complaint filter ignores operator objects and non-whitelisted values', () => {
  const allowed = { statuses: ['Pending'], categories: ['Garbage'], priorities: ['High'] };
  const f = buildComplaintFilter({ status: { $ne: null }, category: 'Hacking', priority: 'High', department: { $gt: '' } }, allowed);
  assert.deepEqual(f, { priority: 'High' });
});

test('complaint filter builds search and date range', () => {
  const f = buildComplaintFilter({ search: 'pot.hole', from: '2026-01-01', to: '2026-01-31' });
  assert.equal(f.$or.length, 4);
  assert.equal(f.$or[1].title.source, 'pot\\.hole');
  assert.ok(f.createdAt.$gte instanceof Date);
  assert.equal(f.createdAt.$lte.toISOString(), '2026-01-31T23:59:59.999Z');
});

test('regex escaping neutralises special characters', () => {
  assert.equal(escapeRegex('a.*b'), 'a\\.\\*b');
  assert.doesNotThrow(() => new RegExp(escapeRegex('(((')));
});

test('sort falls back to newest for unknown keys', () => {
  assert.deepEqual(buildSort('priority'), { priorityWeight: -1, createdAt: -1 });
  assert.deepEqual(buildSort('$where'), { createdAt: -1 });
});

test('pick prevents mass assignment', () => {
  const body = { title: 'x', status: 'Resolved', citizenId: 'someone', role: 'admin' };
  assert.deepEqual(pick(body, ['title', 'description']), { title: 'x' });
});

test('stripDangerousKeys removes operators and prototype keys recursively', () => {
  const input = JSON.parse('{"email":{"$ne":null},"a.b":1,"nested":{"$where":"x","ok":1},"__proto__":{"admin":true}}');
  const out = stripDangerousKeys(input);
  assert.deepEqual(out, { email: {}, nested: { ok: 1 } });
  assert.equal({}.admin, undefined);
});

test('JWT expiry strings convert to milliseconds', () => {
  assert.equal(expiresInToMs('1d'), 864e5);
  assert.equal(expiresInToMs('12h'), 12 * 36e5);
  assert.equal(expiresInToMs('3600'), 36e5);
  assert.equal(expiresInToMs('nonsense'), 864e5);
});

test('image signature check rejects disguised files', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const exe = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00', 'binary');
  assert.ok(matchesSignature(png, 'image/png'));
  assert.ok(matchesSignature(jpg, 'image/jpeg'));
  assert.equal(matchesSignature(exe, 'image/png'), false);
  assert.equal(matchesSignature(png, 'image/jpeg'), false);
  assert.equal(matchesSignature(png, 'application/pdf'), false);
});
