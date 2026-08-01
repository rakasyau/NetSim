import mongoose, { Schema, type Model } from "mongoose";
import { createHash } from "crypto";

/* ============================================================
 * Rate limiting AI + cache prompt identik 24 jam.
 * Pakai MongoDB agar persist di serverless (Vercel).
 * Limit: 20 permintaan generate per user per hari.
 * ============================================================ */

const DAILY_LIMIT = 20;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam

/* ---------- Model: penggunaan harian ---------- */
const AiUsageSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  count: { type: Number, default: 0 },
});
AiUsageSchema.index({ userId: 1, date: 1 }, { unique: true });

type AiUsageDoc = { userId: unknown; date: string; count: number };
type AiUsageModel = Model<AiUsageDoc>;
const AiUsage =
  (mongoose.models.AiUsage as AiUsageModel | undefined) ||
  mongoose.model<AiUsageDoc, AiUsageModel>("AiUsage", AiUsageSchema);

/* ---------- Model: cache prompt ---------- */
const AiCacheSchema = new Schema({
  promptHash: { type: String, required: true, unique: true, index: true },
  mode: { type: String, required: true },
  response: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, expires: 24 * 60 * 60 }, // TTL 24 jam
});
AiCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

type AiCacheDoc = { promptHash: string; mode: string; response: unknown; createdAt: Date };
type AiCacheModel = Model<AiCacheDoc>;
const AiCache =
  (mongoose.models.AiCache as AiCacheModel | undefined) ||
  mongoose.model<AiCacheDoc, AiCacheModel>("AiCache", AiCacheSchema);

/* ---------- Util ---------- */
export function hashPrompt(mode: string, prompt: string): string {
  return createHash("sha256").update(`${mode}:${prompt}`).digest("hex");
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Cek & increment quota harian; throw jika lewat batas. */
export async function consumeDailyQuota(userId: string): Promise<{ remaining: number }> {
  const date = todayKey();
  const doc = await AiUsage.findOneAndUpdate(
    { userId, date },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );
  if (doc.count > DAILY_LIMIT) {
    throw new Error(
      `Batas harian AI tercapai (${DAILY_LIMIT} permintaan/hari). Coba lagi besok.`
    );
  }
  return { remaining: Math.max(0, DAILY_LIMIT - doc.count) };
}

/** Cari cache; null jika miss. */
export async function getCached(mode: string, prompt: string): Promise<unknown | null> {
  const doc = await AiCache.findOne({ promptHash: hashPrompt(mode, prompt) }).lean();
  return doc?.response ?? null;
}

/** Simpan cache. */
export async function setCached(mode: string, prompt: string, response: unknown): Promise<void> {
  await AiCache.updateOne(
    { promptHash: hashPrompt(mode, prompt) },
    { $set: { mode, response, createdAt: new Date() } },
    { upsert: true }
  );
}

export { DAILY_LIMIT };
