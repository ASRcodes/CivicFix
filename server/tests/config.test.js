import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config/env.js';

const base = { MONGODB_URI: 'mongodb://localhost/x', JWT_SECRET: 'a'.repeat(40) };

test('config: missing required variables are reported by name only', () => {
  assert.throws(() => loadConfig({}), (err) => {
    assert.match(err.message, /MONGODB_URI is not set/);
    assert.match(err.message, /JWT_SECRET is not set/);
    return true;
  });
});

test('config: short JWT secret is rejected', () => {
  assert.throws(() => loadConfig({ ...base, JWT_SECRET: 'short' }), /at least 32/);
});

test('config: SameSite=None requires Secure cookies', () => {
  assert.throws(() => loadConfig({ ...base, COOKIE_SAME_SITE: 'none' }), /requires COOKIE_SECURE=true/);
  assert.equal(loadConfig({ ...base, COOKIE_SAME_SITE: 'none', COOKIE_SECURE: 'true' }).cookie.sameSite, 'none');
});

test('config: placeholder secret is refused in production', () => {
  assert.throws(
    () => loadConfig({ ...base, NODE_ENV: 'production', JWT_SECRET: 'replace-with-a-long-random-secret-of-at-least-32-chars' }),
    /placeholder/,
  );
});

test('config: defaults and list parsing', () => {
  const c = loadConfig({ ...base, CLIENT_ORIGIN: 'http://a.com, http://b.com', CITIZEN_EDITABLE_STATUSES: 'Pending,Under Review' });
  assert.deepEqual(c.clientOrigins, ['http://a.com', 'http://b.com']);
  assert.deepEqual(c.citizenEditableStatuses, ['Pending', 'Under Review']);
  assert.equal(c.port, 5000);
  assert.equal(c.maxUploadBytes, 2 * 1024 * 1024);
});
