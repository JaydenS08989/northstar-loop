import { ObjectId } from "mongodb";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getCollection,
  handleApiError,
  requireUserId,
  sendData,
  sendError,
  serializeMilestone,
  type GoalRecord,
  type MilestoneRecord,
} from "@/lib";
import type { ApiError, ApiSuccess, Milestone } from "@/types";
import { milestoneSchema } from "@/validation";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiSuccess<Milestone | Milestone[]> | ApiError>,
) {
  try {
    const userId = requireUserId(req);
    const milestones = await getCollection<MilestoneRecord>("milestones");

    if (req.method === "GET") {
      const goalId = typeof req.query.goalId === "string" && ObjectId.isValid(req.query.goalId)
        ? new ObjectId(req.query.goalId)
        : null;
      const rows = await milestones.find({ userId, ...(goalId ? { goalId } : {}) }).sort({ order: 1 }).toArray();
      return sendData(res, rows.map(serializeMilestone));
    }

    if (req.method === "POST") {
      const parsed = milestoneSchema.safeParse(req.body);
      if (!parsed.success || !ObjectId.isValid(parsed.data?.goalId ?? "")) {
        return sendError(res, 400, "VALIDATION_ERROR", parsed.success ? "Invalid goal ID." : parsed.error.issues[0]?.message ?? "Invalid milestone.");
      }
      const goalId = new ObjectId(parsed.data.goalId);
      const goals = await getCollection<GoalRecord>("goals");
      const ownsGoal = await goals.countDocuments({ _id: goalId, userId }, { limit: 1 });
      if (!ownsGoal) return sendError(res, 404, "GOAL_NOT_FOUND", "Goal not found.");
      const now = new Date();
      const record: MilestoneRecord = {
        userId,
        goalId,
        title: parsed.data.title,
        description: parsed.data.description,
        targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null,
        status: "not_started",
        order: parsed.data.order,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
      };
      const result = await milestones.insertOne(record);
      return sendData(res, serializeMilestone({ _id: result.insertedId, ...record }), 201);
    }

    return sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
  } catch (error) {
    return handleApiError(res, error);
  }
}
