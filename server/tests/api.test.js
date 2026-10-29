/**
 * Integration tests: real Express app + in-memory MongoDB.
 * Run: npm test   (first run downloads a MongoDB binary, ~100 MB, needs internet)
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { HEADER, startTestEnvironment, stopTestEnvironment } from './helpers.js';

let env;
let app;
const STRONG = 'Passw0rdOK';

const validComplaint = {
  title: 'Pothole on Station Road',
  description: 'A large pothole near the bus stop is causing accidents for two-wheelers every evening.',
  category: 'Roads & Potholes',
  priority: 'High',
  address: '12 Station Road, near bus stop',
  city: 'Old Market',
};

async function registerAgent(email, name = 'Test Citizen') {
  const agent = request.agent(app);
  const res = await agent.post('/api/v1/auth/register').set(HEADER)
    .send({ name, email, password: STRONG, confirmPassword: STRONG });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return { agent, user: res.body.data.user };
}

async function adminAgent() {
  const { User } = env.models;
  await User.create({
    name: 'Admin', email: 'admin@test.local', role: 'admin', passwordHash: await User.hashPassword(STRONG),
  });
  const agent = request.agent(app);
  const res = await agent.post('/api/v1/auth/login').set(HEADER).send({ email: 'admin@test.local', password: STRONG });
  assert.equal(res.status, 200);
  return agent;
}

let citizenA; let citizenB; let admin; let complaintId; let reference;

before(async () => {
  env = await startTestEnvironment();
  app = env.app;
  citizenA = await registerAgent('alice@test.local', 'Alice');
  citizenB = await registerAgent('bob@test.local', 'Bob');
  admin = await adminAgent();
});

after(async () => {
  if (env) await stopTestEnvironment(env);
});

describe('authentication', () => {
  test('passwords are stored hashed, never in plain text', async () => {
    const user = await env.models.User.findOne({ email: 'alice@test.local' }).select('+passwordHash').lean();
    assert.notEqual(user.passwordHash, STRONG);
    assert.match(user.passwordHash, /^\$2[aby]\$/);
  });

  test('register sets an httpOnly cookie and never returns the hash', async () => {
    const res = await request(app).post('/api/v1/auth/register').set(HEADER)
      .send({ name: 'Carol', email: 'carol@test.local', password: STRONG, confirmPassword: STRONG });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.user.passwordHash, undefined);
    const cookie = res.headers['set-cookie'].join(';');
    assert.match(cookie, /civicfix_token=/);
    assert.match(cookie, /HttpOnly/i);
  });

  test('registration cannot self-assign the admin role', async () => {
    const res = await request(app).post('/api/v1/auth/register').set(HEADER)
      .send({ name: 'Mallory', email: 'mallory@test.local', password: STRONG, confirmPassword: STRONG, role: 'admin' });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.user.role, 'citizen');
  });

  test('duplicate registration returns 409', async () => {
    const res = await request(app).post('/api/v1/auth/register').set(HEADER)
      .send({ name: 'Alice 2', email: 'ALICE@test.local', password: STRONG, confirmPassword: STRONG });
    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
  });

  test('missing fields and mismatched passwords return 422 with field errors', async () => {
    const res = await request(app).post('/api/v1/auth/register').set(HEADER)
      .send({ email: 'not-an-email', password: 'weak', confirmPassword: 'other' });
    assert.equal(res.status, 422);
    const fields = res.body.errors.map((e) => e.field);
    for (const f of ['name', 'email', 'password', 'confirmPassword']) assert.ok(fields.includes(f), `missing error for ${f}`);
  });

  test('invalid login returns 401 with a generic message', async () => {
    const wrongPw = await request(app).post('/api/v1/auth/login').set(HEADER).send({ email: 'alice@test.local', password: 'Wrong1234' });
    const noUser = await request(app).post('/api/v1/auth/login').set(HEADER).send({ email: 'ghost@test.local', password: 'Wrong1234' });
    assert.equal(wrongPw.status, 401);
    assert.equal(noUser.status, 401);
    assert.equal(wrongPw.body.message, noUser.body.message);
  });

  test('NoSQL operator injection in login is neutralised', async () => {
    const res = await request(app).post('/api/v1/auth/login').set(HEADER)
      .send({ email: { $ne: null }, password: { $ne: null } });
    assert.ok([401, 422].includes(res.status));
  });

  test('/auth/me requires authentication', async () => {
    assert.equal((await request(app).get('/api/v1/auth/me')).status, 401);
    const res = await citizenA.agent.get('/api/v1/auth/me');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.email, 'alice@test.local');
  });

  test('state-changing requests without the client header are rejected (CSRF guard)', async () => {
    const res = await citizenA.agent.post('/api/v1/complaints').send(validComplaint);
    assert.equal(res.status, 403);
  });

  test('a tampered token is rejected', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer abc.def.ghi');
    assert.equal(res.status, 401);
  });
});

describe('complaints CRUD and ownership', () => {
  test('missing required fields return 422', async () => {
    const res = await citizenA.agent.post('/api/v1/complaints').set(HEADER).send({ title: 'Hi' });
    assert.equal(res.status, 422);
    const fields = res.body.errors.map((e) => e.field);
    for (const f of ['title', 'description', 'category', 'address', 'city']) assert.ok(fields.includes(f));
  });

  test('citizen creates a complaint with a reference number and history', async () => {
    const res = await citizenA.agent.post('/api/v1/complaints').set(HEADER)
      .send({ ...validComplaint, status: 'Resolved', citizenId: citizenB.user._id, referenceNumber: 'CF-1999-000001' });
    assert.equal(res.status, 201);
    const c = res.body.data.complaint;
    assert.match(c.referenceNumber, /^CF-\d{4}-\d{6}$/);
    assert.notEqual(c.referenceNumber, 'CF-1999-000001', 'mass assignment of reference ignored');
    assert.equal(c.status, 'Pending', 'mass assignment of status ignored');
    assert.equal(c.citizenId, citizenA.user._id, 'mass assignment of owner ignored');
    complaintId = c._id;
    reference = c.referenceNumber;
    const activity = await citizenA.agent.get(`/api/v1/complaints/${complaintId}/activity`);
    assert.equal(activity.body.data.timeline[0].action, 'CREATED');
  });

  test('concurrent submissions receive unique reference numbers', async () => {
    const results = await Promise.all(Array.from({ length: 8 }, () =>
      citizenB.agent.post('/api/v1/complaints').set(HEADER).send(validComplaint)));
    const refs = results.map((r) => r.body.data.complaint.referenceNumber);
    assert.equal(new Set(refs).size, refs.length);
  });

  test('citizen lists only their own complaints', async () => {
    const res = await citizenA.agent.get('/api/v1/complaints');
    assert.equal(res.status, 200);
    assert.ok(res.body.data.complaints.every((c) => c.citizenId === citizenA.user._id));
    assert.equal(res.body.meta.total, 1);
  });

  test('summary counts only the current citizen\'s complaints', async () => {
    const res = await citizenA.agent.get('/api/v1/complaints/summary');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.total, 1);
    assert.equal(res.body.data.byStatus.Pending, 1);
  });

  test("citizen cannot view, edit or delete another user's complaint", async () => {
    assert.equal((await citizenB.agent.get(`/api/v1/complaints/${complaintId}`)).status, 403);
    assert.equal((await citizenB.agent.patch(`/api/v1/complaints/${complaintId}`).set(HEADER).send({ title: 'Hijacked title' })).status, 403);
    assert.equal((await citizenB.agent.delete(`/api/v1/complaints/${complaintId}`).set(HEADER)).status, 403);
  });

  test('missing complaint returns 404 and malformed id returns 422', async () => {
    assert.equal((await citizenA.agent.get('/api/v1/complaints/64b000000000000000000000')).status, 404);
    assert.equal((await citizenA.agent.get('/api/v1/complaints/not-an-id')).status, 422);
  });

  test('owner can edit while Pending', async () => {
    const res = await citizenA.agent.patch(`/api/v1/complaints/${complaintId}`).set(HEADER).send({ title: 'Big pothole on Station Road' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.complaint.title, 'Big pothole on Station Road');
  });

  test('public tracking by reference exposes no personal data', async () => {
    const res = await request(app).get(`/api/v1/complaints/reference/${reference}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.complaint.address, undefined);
    assert.equal(res.body.data.complaint.citizenId, undefined);
    assert.equal((await request(app).get('/api/v1/complaints/reference/CF-2000-999999')).status, 404);
    assert.equal((await request(app).get('/api/v1/complaints/reference/abc')).status, 422);
  });
});

describe('admin operations and status workflow', () => {
  test('citizen cannot use admin endpoints', async () => {
    assert.equal((await citizenA.agent.get('/api/v1/admin/dashboard')).status, 403);
    assert.equal((await citizenA.agent.patch(`/api/v1/admin/complaints/${complaintId}/status`).set(HEADER).send({ status: 'Resolved' })).status, 403);
    assert.equal((await citizenA.agent.post('/api/v1/admin/departments').set(HEADER).send({ name: 'Fake' })).status, 403);
  });

  test('citizen cannot add internal notes', async () => {
    const res = await citizenA.agent.post(`/api/v1/complaints/${complaintId}/updates`).set(HEADER).send({ internalNote: 'secret' });
    assert.equal(res.status, 403);
  });

  test('invalid status transition is rejected with 422', async () => {
    const res = await admin.patch(`/api/v1/admin/complaints/${complaintId}/status`).set(HEADER).send({ status: 'Resolved' });
    assert.equal(res.status, 422);
  });

  test('rejection requires a reason', async () => {
    const res = await admin.patch(`/api/v1/admin/complaints/${complaintId}/status`).set(HEADER).send({ status: 'Rejected' });
    assert.equal(res.status, 422);
  });

  test('valid transitions persist history with actor', async () => {
    for (const status of ['Under Review', 'In Progress', 'Resolved']) {
      const res = await admin.patch(`/api/v1/admin/complaints/${complaintId}/status`).set(HEADER)
        .send({ status, internalNote: `secret note for ${status}` });
      assert.equal(res.status, 200, JSON.stringify(res.body));
    }
    const { ComplaintActivity, Complaint } = env.models;
    const changes = await ComplaintActivity.find({ complaintId, action: 'STATUS_CHANGED' }).lean();
    assert.equal(changes.length, 3);
    assert.ok(changes.every((c) => c.actorId && c.createdAt));
    const c = await Complaint.findById(complaintId).lean();
    assert.ok(c.resolvedAt instanceof Date);
  });

  test('citizen never sees internal notes', async () => {
    await admin.post(`/api/v1/complaints/${complaintId}/updates`).set(HEADER).send({ internalNote: 'admin-only remark' });
    const res = await citizenA.agent.get(`/api/v1/complaints/${complaintId}`);
    const json = JSON.stringify(res.body);
    assert.equal(json.includes('secret note'), false);
    assert.equal(json.includes('admin-only remark'), false);
    const adminView = await admin.get(`/api/v1/complaints/${complaintId}/activity`);
    assert.ok(JSON.stringify(adminView.body).includes('admin-only remark'));
  });

  test('owner cannot edit once the complaint has left Pending', async () => {
    const res = await citizenA.agent.patch(`/api/v1/complaints/${complaintId}`).set(HEADER).send({ title: 'Changed again title' });
    assert.equal(res.status, 409);
  });

  test('department CRUD and assignment', async () => {
    const created = await admin.post('/api/v1/admin/departments').set(HEADER).send({ name: 'Roads', description: 'Road works' });
    assert.equal(created.status, 201);
    const deptId = created.body.data.department._id;
    const dup = await admin.post('/api/v1/admin/departments').set(HEADER).send({ name: 'roads' });
    assert.equal(dup.status, 409, 'case-insensitive unique name');

    const list = await citizenB.agent.get('/api/v1/complaints?limit=1');
    const target = list.body.data.complaints[0]._id;
    const assigned = await admin.patch(`/api/v1/admin/complaints/${target}/assign`).set(HEADER).send({ departmentId: deptId, assignedTo: 'Crew 4' });
    assert.equal(assigned.status, 200);
    assert.equal(assigned.body.data.complaint.assignedTo, 'Crew 4');

    const del = await admin.delete(`/api/v1/admin/departments/${deptId}`).set(HEADER);
    assert.equal(del.body.data.department.isActive, false);
    const again = await admin.patch(`/api/v1/admin/complaints/${target}/assign`).set(HEADER).send({ departmentId: deptId });
    assert.equal(again.status, 422, 'cannot assign to inactive department');
  });

  test('server-side filtering, search, sorting and pagination', async () => {
    const byStatus = await admin.get('/api/v1/admin/complaints?status=Resolved');
    assert.ok(byStatus.body.data.complaints.every((c) => c.status === 'Resolved'));
    const paged = await admin.get('/api/v1/admin/complaints?limit=3&page=2');
    assert.equal(paged.body.data.complaints.length, 3);
    assert.equal(paged.body.meta.page, 2);
    const search = await admin.get(`/api/v1/admin/complaints?search=${encodeURIComponent(reference)}`);
    assert.equal(search.body.meta.total, 1);
    const bad = await admin.get('/api/v1/admin/complaints?status=Hacked');
    assert.equal(bad.status, 422);
    const injected = await admin.get('/api/v1/admin/complaints?status[$ne]=x');
    assert.ok([200, 422].includes(injected.status));
    const future = await admin.get('/api/v1/admin/complaints?from=2099-01-01');
    assert.equal(future.body.meta.total, 0);
  });

  test('dashboard statistics come from the database', async () => {
    const res = await admin.get('/api/v1/admin/dashboard');
    assert.equal(res.status, 200);
    const total = await env.models.Complaint.countDocuments();
    assert.equal(res.body.data.totals.total, total);
    assert.equal(res.body.data.totals.resolved, 1);
  });

  test('the last active administrator cannot be deactivated', async () => {
    const adminUser = await env.models.User.findOne({ role: 'admin' });
    const second = await env.models.User.create({
      name: 'Second Admin', email: 'admin2@test.local', role: 'admin', passwordHash: await env.models.User.hashPassword(STRONG),
    });
    // deactivate the second admin -> allowed (one remains)
    assert.equal((await admin.patch(`/api/v1/admin/users/${second._id}/status`).set(HEADER).send({ isActive: false })).status, 200);
    // deactivate self -> refused
    assert.equal((await admin.patch(`/api/v1/admin/users/${adminUser._id}/status`).set(HEADER).send({ isActive: false })).status, 409);
  });

  test('admin users list includes complaint counts', async () => {
    const res = await admin.get('/api/v1/admin/users?search=bob');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.users[0].complaintCount, 8);
  });

  test('deactivated users are locked out', async () => {
    const bob = await env.models.User.findOne({ email: 'bob@test.local' });
    await admin.patch(`/api/v1/admin/users/${bob._id}/status`).set(HEADER).send({ isActive: false });
    assert.equal((await citizenB.agent.get('/api/v1/complaints')).status, 403);
    const login = await request(app).post('/api/v1/auth/login').set(HEADER).send({ email: 'bob@test.local', password: STRONG });
    assert.equal(login.status, 403);
  });
});

describe('public endpoints and errors', () => {
  test('public stats and recent complaints are privacy-safe', async () => {
    const stats = await request(app).get('/api/v1/public/stats');
    assert.equal(stats.status, 200);
    assert.equal(typeof stats.body.data.total, 'number');
    const recent = await request(app).get('/api/v1/public/recent-complaints');
    for (const c of recent.body.data.complaints) {
      assert.equal(c.address, undefined);
      assert.equal(c.citizenId, undefined);
      assert.equal(c.description, undefined);
    }
  });

  test('unknown routes return a JSON 404', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  test('malformed JSON returns 400', async () => {
    const res = await request(app).post('/api/v1/auth/login').set(HEADER)
      .set('Content-Type', 'application/json').send('{"email":');
    assert.equal(res.status, 400);
  });

  test('citizen can delete own Pending complaint and its history', async () => {
    const created = await citizenA.agent.post('/api/v1/complaints').set(HEADER).send(validComplaint);
    const id = created.body.data.complaint._id;
    assert.equal((await citizenA.agent.delete(`/api/v1/complaints/${id}`).set(HEADER)).status, 200);
    assert.equal(await env.models.ComplaintActivity.countDocuments({ complaintId: id }), 0);
  });
});
