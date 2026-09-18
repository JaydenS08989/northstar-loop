import { z } from "zod";
import type { NextApiRequest, NextApiResponse } from "next";
import { consumeRateLimit, handleApiError, requestReplan, requireUserId, sendData, sendError } from "@/lib";
import type { AiReplan } from "@/lib/ai";
import type { ApiError, ApiSuccess } from "@/types";

const schema = z.object({ goal: z.string().min(2).max(500), context: z.string().min(1).max(6000), preferences: z.string().min(1).max(1500) });

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiSuccess<AiReplan> | ApiError>) {
  try {
    const userId = requireUserId(req);
    if (req.method !== "POST") return sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    const limit = await consumeRateLimit(`ai:${userId}`, 20, 10 * 60 * 1000);
    if (!limit.allowed) return sendError(res, 429, "RATE_LIMITED", "Northstar guidance is temporarily rate limited. Please try again shortly.");
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid request.");
    const result = await requestReplan(parsed.data);
    if (!result) return sendError(res, 503, "AI_UNAVAILABLE", "Northstar replanning is temporarily unavailable.");
    return sendData(res, result);
  } catch (error) {
    return handleApiError(res, error);
  }
}
