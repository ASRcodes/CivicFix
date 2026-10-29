/**
 * Verifies graceful behaviour when MongoDB is unavailable: API routes answer 503
 * quickly instead of hanging, and the health check reports the database state.
 * No MongoDB is started in this test.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/unreachable';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-validation-123';

const { resetConfigCache } = await import('../src/config/env.js');
resetConfigCache();
const { createApp } = await import('../src/app.js');
const app = createApp();

test('API returns 503 when the database is not connected', async () => {
  const res = await request(app).get('/api/v1/public/stats');
  assert.equal(res.status, 503);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /temporarily unavailable/);
});

test('health check reports a disconnected database', async () => {
  const res = await request(app).get('/api/v1/health');
  assert.equal(res.status, 503);
  assert.equal(res.body.data.database, 'disconnected');
});
