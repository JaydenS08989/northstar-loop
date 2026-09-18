import { ObjectId } from "mongodb";
import type { NextApiRequest, NextApiResponse } from "next";
import { getCollection, handleApiError, requireUserId, sendData, sendError, serializeGoal, type GoalRecord } from "@/lib";
import type { ApiError, ApiSuccess, Goal } from "@/types";
import { goalSchema } from "@/validation";

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiSuccess<Goal | Goal[]> | ApiError>) {
  try {
    const userId = requireUserId(req); const collection = await getCollection<GoalRecord>("goals");
    if (req.method === "GET") { const rows = await collection.find({ userId, status: { $ne: "archived" } }).sort({ createdAt: -1 }).toArray(); return sendData(res, rows.map(serializeGoal)); }
    if (req.method === "POST") { const parsed = goalSchema.safeParse(req.body); if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid goal."); const now = new Date(); const record: GoalRecord = { userId, title: parsed.data.title, description: parsed.data.description, successCriteria: parsed.data.successCriteria, priority: parsed.data.priority, status: "not_started", targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null, createdAt: now, updatedAt: now, completedAt: null, archivedAt: null }; const result = await collection.insertOne(record); return sendData(res, serializeGoal({ _id: result.insertedId, ...record }), 201); }
    return sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
  } catch (error) { return handleApiError(res, error); }
}
