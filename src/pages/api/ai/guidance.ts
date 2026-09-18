import { z } from "zod";
import type { NextApiRequest, NextApiResponse } from "next";
import { consumeRateLimit, handleApiError, requestPlanningGuidance, requireUserId, sendData, sendError } from "@/lib";
import type { ApiError, ApiSuccess } from "@/types";

const schema = z.object({ goal: z.string().min(1).max(500), context: z.string().max(4000), request: z.string().min(1).max(500) });
type Guidance = { title: string; summary: string; reason: string; suggestedActions: string[]; source: "ai" | "fallback" };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiSuccess<Guidance> | ApiError>) {
  try {
    const userId = requireUserId(req);
    if (req.method !== "POST") return sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    const rateLimit = await consumeRateLimit(`ai:${userId}`, 20, 10 * 60 * 1000);
    if (!rateLimit.allowed) return sendError(res, 429, "RATE_LIMITED", "Northstar guidance is temporarily rate limited. Please try again shortly.");
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid request.");
    const ai = await requestPlanningGuidance(parsed.data);
    if (ai) return sendData(res, { ...ai, source: "ai" });
    return sendData(res, {
      title: "Keep the next step small",
      summary: "Choose one concrete action you can finish in your available time.",
      reason: "Northstar AI is temporarily unavailable, so this uses deterministic fallback guidance.",
      suggestedActions: ["Identify the smallest unblocked task", "Time-box it to one focus session", "Review the plan after completing it"],
      source: "fallback",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
