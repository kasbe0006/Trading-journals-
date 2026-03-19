import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "@/lib/env";
import { Trade } from "@/models/Trade";
import { User } from "@/models/User";

declare global {
  var mongooseConnection: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
    indexesPromise: Promise<void> | null;
    defaultAdminPromise: Promise<void> | null;
  };
}

const cached = global.mongooseConnection || {
  conn: null,
  promise: null,
  indexesPromise: null,
  defaultAdminPromise: null,
};

if (!global.mongooseConnection) {
  global.mongooseConnection = cached;
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(env.MONGODB_URI, {
      dbName: "ai-trading-journal-pro",
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
  }

  cached.conn = await cached.promise;

  if (!cached.indexesPromise) {
    cached.indexesPromise = initializeIndexes();
  }

  await cached.indexesPromise;

  if (env.AUTH_ENABLED && env.DEFAULT_ADMIN_ENABLED) {
    if (!cached.defaultAdminPromise) {
      cached.defaultAdminPromise = ensureDefaultAdminUser();
    }
    await cached.defaultAdminPromise;
  }

  return cached.conn;
}

async function initializeIndexes() {
  try {
    await Promise.all([User.createIndexes(), Trade.createIndexes()]);
  } catch (error) {
    console.error("[db] Failed to initialize MongoDB indexes", error);
  }
}

async function ensureDefaultAdminUser() {
  try {
    const username = env.DEFAULT_ADMIN_USERNAME.trim();
    const email = env.DEFAULT_ADMIN_EMAIL.trim().toLowerCase();
    const password = env.DEFAULT_ADMIN_PASSWORD;

    if (!username || !email || !password || password.length < 6) {
      console.warn("[db] Default admin skipped due to invalid DEFAULT_ADMIN_* values");
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    await User.create({
      name: username,
      email,
      password: hash,
    });

    console.log(`[db] Default admin ensured for ${email}`);
  } catch (error) {
    console.error("[db] Failed to ensure default admin user", error);
  }
}
