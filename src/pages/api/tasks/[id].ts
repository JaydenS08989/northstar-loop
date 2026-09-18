import { ObjectId } from "mongodb";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  getCollection,
  handleApiError,
  requireUserId,
  sendData,
  sendError,
  serializeTask,
  type MilestoneRecord,
  type TaskRecord,
} from "@/lib";
import type { ApiError, ApiSuccess, Task } from "@/types";
import { taskSchema } from "@/validation";

const taskPatchSchema = taskSchema
  .omit({ goalId: true, milestoneId: true })
  .partial()
  .extend({
    milestoneId: z.string().nullable().optional(),
    status: z.enum(["todo", "in_progress", "completed", "blocked"]).optional(),
    blockedReason: z.string().max(500).nullable().optional(),
  });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiSuccess<Task | { deleted: true }> | ApiError>,
) {
  try {
    const userId = requireUserId(req);
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;

    if (!id || !ObjectId.isValid(id)) {
      return sendError(res, 400, "INVALID_ID", "Invalid task ID.");
    }

    const _id = new ObjectId(id);
    const tasks = await getCollection<TaskRecord>("tasks");

    if (req.method === "PATCH") {
      const existing = await tasks.findOne({ _id, userId });
      if (!existing) return sendError(res, 404, "NOT_FOUND", "Task not found.");

      const parsed = taskPatchSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(
          res,
          400,
          "VALIDATION_ERROR",
          parsed.error.issues[0]?.message ?? "Invalid task data.",
        );
      }

      const { dueDate, plannedDate, status, milestoneId, ...changes } = parsed.data;
      const $set: Partial<TaskRecord> = { ...changes, updatedAt: new Date() };

      if (dueDate !== undefined) $set.dueDate = dueDate ? new Date(dueDate) : null;
      if (plannedDate !== undefined) $set.plannedDate = plannedDate ? new Date(plannedDate) : null;
      if (status !== undefined) {
        $set.status = status;
        $set.completedAt = status === "completed" ? new Date() : null;
      }

      if (milestoneId !== undefined) {
        if (milestoneId === null) {
          $set.milestoneId = null;
        } else {
          if (!ObjectId.isValid(milestoneId)) {
            return sendError(res, 400, "INVALID_MILESTONE", "Invalid milestone ID.");
          }
          const milestones = await getCollection<MilestoneRecord>("milestones");
          const milestoneObjectId = new ObjectId(milestoneId);
          const ownsMilestone = await milestones.findOne({
            _id: milestoneObjectId,
            userId,
            goalId: existing.goalId,
          });
          if (!ownsMilestone) {
            return sendError(res, 404, "MILESTONE_NOT_FOUND", "Milestone not found for this goal.");
          }
          $set.milestoneId = milestoneObjectId;
        }
      }

      const row = await tasks.findOneAndUpdate(
        { _id, userId },
        { $set },
        { returnDocument: "after" },
      );

      if (!row) return sendError(res, 404, "NOT_FOUND", "Task not found.");
      return sendData(res, serializeTask(row));
    }

    if (req.method === "DELETE") {
      const result = await tasks.deleteOne({ _id, userId });
      if (!result.deletedCount) return sendError(res, 404, "NOT_FOUND", "Task not found.");
      return sendData(res, { deleted: true });
    }

    return sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
  } catch (error) {
    return handleApiError(res, error);
  }
}
