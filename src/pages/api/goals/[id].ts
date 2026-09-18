import { ObjectId } from "mongodb";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  getCollection,
  handleApiError,
  requireUserId,
  sendData,
  sendError,
  sendGoalCompletedEmail,
  serializeGoal,
  type GoalRecord,
  type MilestoneRecord,
  type TaskRecord,
  type UserRecord,
} from "@/lib";
import type { ApiError, ApiSuccess, Goal } from "@/types";
import { goalSchema } from "@/validation";

const goalPatchSchema = goalSchema.partial().extend({
  status: z.enum(["not_started", "in_progress", "completed", "archived"]).optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiSuccess<Goal | { deleted: true }> | ApiError>,
) {
  try {
    const userId = requireUserId(req);
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    if (!id || !ObjectId.isValid(id)) return sendError(res, 400, "INVALID_ID", "Invalid goal ID.");
    const _id = new ObjectId(id);
    const goals = await getCollection<GoalRecord>("goals");

    if (req.method === "GET") {
      const row = await goals.findOne({ _id, userId });
      if (!row) return sendError(res, 404, "NOT_FOUND", "Goal not found.");
      return sendData(res, serializeGoal(row));
    }

    if (req.method === "PATCH") {
      const previous = await goals.findOne({ _id, userId });
      if (!previous) return sendError(res, 404, "NOT_FOUND", "Goal not found.");
      const parsed = goalPatchSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid goal.");
      const { targetDate, status, ...changes } = parsed.data;
      const $set: Partial<GoalRecord> = { ...changes, updatedAt: new Date() };
      if (targetDate !== undefined) $set.targetDate = targetDate ? new Date(targetDate) : null;
      if (status !== undefined) {
        $set.status = status;
        $set.completedAt = status === "completed" ? new Date() : null;
        $set.archivedAt = status === "archived" ? new Date() : null;
      }
      const row = await goals.findOneAndUpdate({ _id, userId }, { $set }, { returnDocument: "after" });
      if (!row) return sendError(res, 404, "NOT_FOUND", "Goal not found.");

      if (status === "completed" && previous.status !== "completed") {
        const users = await getCollection<UserRecord>("users");
        const user = await users.findOne({ clerkUserId: userId });
        if (user) await sendGoalCompletedEmail(user, row.title);
      }
      return sendData(res, serializeGoal(row));
    }

    if (req.method === "DELETE") {
      const milestones = await getCollection<MilestoneRecord>("milestones");
      const tasks = await getCollection<TaskRecord>("tasks");
      const result = await goals.deleteOne({ _id, userId });
      if (!result.deletedCount) return sendError(res, 404, "NOT_FOUND", "Goal not found.");
      await Promise.all([
        milestones.deleteMany({ userId, goalId: _id }),
        tasks.deleteMany({ userId, goalId: _id }),
      ]);
      return sendData(res, { deleted: true });
    }

    return sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
  } catch (error) {
    return handleApiError(res, error);
  }
}
