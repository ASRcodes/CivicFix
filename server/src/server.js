import mongoose from 'mongoose';
import { getConfig } from './config/env.js';
import { connectDB } from './config/db.js';
import { ensureUploadDir } from './services/fileService.js';
import { createApp } from './app.js';

async function start() {
  let config;
  try {
    config = getConfig();
  } catch (err) {
    console.error(`\n${err.message}\n\nCopy server/.env.example to server/.env and fill in the values.\n`);
    process.exit(1);
  }

  await ensureUploadDir();

  try {
    await connectDB(config.mongoUri);
  } catch (err) {
    console.error(`[startup] ${err.message}`);
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`[server] CivicFix API listening on http://localhost:${config.port}/api/v1 (${config.nodeEnv})`);
  });

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down...`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    console.error('[server] Unhandled promise rejection:', reason instanceof Error ? reason.message : reason);
  });
}

start();
