/**
 * Integration-test helpers. Uses mongodb-memory-server (downloads a MongoDB binary
 * on first run) so tests never touch your real database.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

export const HEADER = { 'X-Requested-With': 'XMLHttpRequest' };

export async function startTestEnvironment() {
  const mongo = await MongoMemoryServer.create();
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = mongo.getUri('civicfix-test');
  process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-validation-123';
  process.env.CLIENT_ORIGIN = 'http://localhost:5173';

  const { resetConfigCache } = await import('../src/config/env.js');
  resetConfigCache();
  const mongoose = (await import('mongoose')).default;
  await mongoose.connect(process.env.MONGODB_URI);
  const { createApp } = await import('../src/app.js');
  const models = await import('../src/models/index.js');
  await Promise.all(Object.values(models).map((m) => m.init()));
  return { mongo, mongoose, app: createApp(), models };
}

export async function stopTestEnvironment({ mongo, mongoose }) {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongo.stop();
}
