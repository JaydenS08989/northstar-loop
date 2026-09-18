import type { Document } from "mongodb";
import { getCollection } from "./mongodb";

type RateLimitRecord = Document & {
  _id: string;
  count: number;
  resetAt: Date;
};

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: Date };

export const consumeRateLimit = async (
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> => {
  const collection = await getCollection<RateLimitRecord>("rateLimits");
  const now = new Date();
  const existing = await collection.findOne({ _id: key });
  if (existing && existing.resetAt <= now) await collection.deleteOne({ _id: key });

  const resetAt = new Date(now.getTime() + windowMs);
  const row = await collection.findOneAndUpdate(
    { _id: key },
    { $inc: { count: 1 }, $setOnInsert: { resetAt } },
    { upsert: true, returnDocument: "after" },
  );
  const count = row?.count ?? limit + 1;
  return { allowed: count <= limit, remaining: Math.max(0, limit - count), resetAt: row?.resetAt ?? resetAt };
};
