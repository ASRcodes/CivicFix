/**
 * First-admin bootstrap (server-side only - there is NO HTTP endpoint that grants admin rights).
 *
 * Usage:
 *   npm run create-admin                         # uses ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD from .env, prompts if password empty
 *   npm run create-admin -- --email a@b.com --name "Jane Admin"
 *   npm run create-admin -- --email existing@user.com --promote   # promote an existing account
 */
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import mongoose from 'mongoose';
import { getConfig } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { ROLES } from '../src/utils/constants.js';

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/;

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}
const flag = (name) => process.argv.includes(`--${name}`);

async function main() {
  const config = getConfig();
  const email = (arg('email') || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const name = (arg('name') || process.env.ADMIN_NAME || 'CivicFix Administrator').trim();
  let password = process.env.ADMIN_PASSWORD || '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Provide a valid admin email with --email or ADMIN_EMAIL in .env');
  }

  await connectDB(config.mongoUri, { retries: 2, delayMs: 1500 });
  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role === ROLES.ADMIN) {
      console.log(`An administrator with email ${email} already exists. Nothing to do.`);
      return;
    }
    if (!flag('promote')) {
      throw new Error(`${email} is a citizen account. Re-run with --promote to make it an administrator.`);
    }
    existing.role = ROLES.ADMIN;
    existing.isActive = true;
    await existing.save();
    console.log(`Promoted ${email} to administrator.`);
    return;
  }

  if (!password) {
    const rl = readline.createInterface({ input, output });
    password = await rl.question('Password for the new administrator (input is visible): ');
    rl.close();
  }
  if (!PASSWORD_RULE.test(password)) {
    throw new Error('Password must be 8-72 characters with upper-case, lower-case and a number');
  }

  await User.create({ name, email, role: ROLES.ADMIN, passwordHash: await User.hashPassword(password) });
  console.log(`Administrator created: ${email}`);
  console.log('Remove ADMIN_PASSWORD from your .env file now that the account exists.');
}

main()
  .catch((err) => {
    console.error(`create-admin failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
