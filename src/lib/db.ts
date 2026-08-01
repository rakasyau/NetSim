import mongoose from 'mongoose';
import User from '@/models/User';
import Project from '@/models/Project';
import ActivityLog from '@/models/ActivityLog';

/* ---------------------------------------------------------
 * Koneksi MongoDB dengan global cache (Next.js hot-reload safe)
 * Port dari bahan/skema mongoose/index.js
 * ------------------------------------------------------- */
const globalForMongoose = globalThis as unknown as {
  _mongooseConn?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

let cached = globalForMongoose._mongooseConn;
if (!cached) {
  cached = globalForMongoose._mongooseConn = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached!.conn) return cached!.conn;

  if (!cached!.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI belum diset di environment variable');

    cached!.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}

export { User, Project, ActivityLog };
export default connectDB;
