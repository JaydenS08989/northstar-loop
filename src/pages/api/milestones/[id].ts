import { ObjectId } from "mongodb";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  getCollection,
  handleApiError,
  requireUserId,
  sendData,
  sendError,
  sendMilestoneCompletedEmail,
  serializeMilestone,
  type GoalRecord,
  type MilestoneRecord,
  type UserRecord,
  type TaskRecord,
} from "@/lib";
import type { ApiError, ApiSuccess, Milestone } from "@/types";
import { milestoneSchema } from "@/validation";

const patchSchema = milestoneSchema.omit({ goalId: true }).partial().extend({
  status: z.enum(["not_started", "in_progress", "completed"]).optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiSuccess<Milestone | { deleted: true }> | ApiError>,
) {
  try {
    const userId = requireUserId(req);
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    if (!id || !ObjectId.isValid(id)) return sendError(res, 400, "INVALID_ID", "Invalid milestone ID.");
    const _id = new ObjectId(id);
    const milestones = await getCollection<MilestoneRecord>("milestones");

    if (req.method === "PATCH") {
      const previous = await milestones.findOne({ _id, userId });
      if (!previous) return sendError(res, 404, "NOT_FOUND", "Milestone not found.");
      const parsed = patchSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid milestone.");
      const { targetDate, status, ...changes } = parsed.data;
      const $set: Partial<MilestoneRecord> = { ...changes, updatedAt: new Date() };
      if (targetDate !== undefined) $set.targetDate = targetDate ? new Date(targetDate) : null;
      if (status !== undefined) {
        $set.status = status;
        $set.completedAt = status === "completed" ? new Date() : null;
      }
      const row = await milestones.findOneAndUpdate({ _id, userId }, { $set }, { returnDocument: "after" });
      if (!row) return sendError(res, 404, "NOT_FOUND", "Milestone not found.");

      if (status === "completed" && previous.status !== "completed") {
        const [goals, users] = await Promise.all([
          getCollection<GoalRecord>("goals"),
          getCollection<UserRecord>("users"),
        ]);
        const [goal, user] = await Promise.all([
          goals.findOne({ _id: row.goalId, userId }),
          users.findOne({ clerkUserId: userId }),
        ]);
        if (goal && user) await sendMilestoneCompletedEmail(user, row.title, goal.title, goal._id.toHexString());
      }
      return sendData(res, serializeMilestone(row));
    }

    if (req.method === "DELETE") {
      const existing = await milestones.findOne({ _id, userId });
      if (!existing) return sendError(res, 404, "NOT_FOUND", "Milestone not found.");
      const tasks = await getCollection<TaskRecord>("tasks");
      await tasks.updateMany({ userId, milestoneId: _id }, { $set: { milestoneId: null, updatedAt: new Date() } });
      await milestones.deleteOne({ _id, userId });
      return sendData(res, { deleted: true });
    }

    return sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
  } catch (error) {
    return handleApiError(res, error);
  }
}
