import mongoose from "mongoose";
import { env } from "@/lib/env";
import { Trade } from "@/models/Trade";
import { User } from "@/models/User";

declare global {
  var mongooseConnection: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
    indexesPromise: Promise<void> | null;
  };
}

const cached = global.mongooseConnection || { conn: null, promise: null, indexesPromise: null };

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
  return cached.conn;
}

async function initializeIndexes() {
  try {
    await Promise.all([User.createIndexes(), Trade.createIndexes()]);
  } catch (error) {
    console.error("[db] Failed to initialize MongoDB indexes", error);
  }
}
