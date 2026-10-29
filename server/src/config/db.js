import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Connects to MongoDB with retries. Logs only host/db name, never credentials. */
export async function connectDB(uri, { retries = 5, delayMs = 3000 } = {}) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log(`[db] Connected to MongoDB (${mongoose.connection.host}/${mongoose.connection.name})`);
      return mongoose.connection;
    } catch (err) {
      console.error(`[db] Connection attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt >= retries) {
        throw new Error('Could not connect to MongoDB. Check MONGODB_URI and that MongoDB is running.');
      }
      await wait(delayMs);
    }
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

mongoose.connection.on('disconnected', () => console.warn('[db] MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('[db] MongoDB reconnected'));
