import { ObjectId } from "mongodb";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getCollection,
  handleApiError,
  requireUserId,
  sendData,
  sendError,
  serializeTask,
  type GoalRecord,
  type MilestoneRecord,
  type TaskRecord,
} from "@/lib";
import type { ApiError, ApiSuccess, Task } from "@/types";
import { taskSchema } from "@/validation";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiSuccess<Task | Task[]> | ApiError>,
) {
  try {
    const userId = requireUserId(req);
    const tasks = await getCollection<TaskRecord>("tasks");

    if (req.method === "GET") {
      const goalId = typeof req.query.goalId === "string" && ObjectId.isValid(req.query.goalId)
        ? new ObjectId(req.query.goalId)
        : null;
      const filter: Record<string, unknown> = { userId, ...(goalId ? { goalId } : {}) };
      if (req.query.status === "open") filter.status = { $in: ["todo", "in_progress", "blocked"] };
      const rows = await tasks.find(filter).sort({ dueDate: 1, createdAt: -1 }).toArray();
      return sendData(res, rows.map(serializeTask));
    }

    if (req.method === "POST") {
      const parsed = taskSchema.safeParse(req.body);
      if (!parsed.success || !ObjectId.isValid(parsed.data?.goalId ?? "")) {
        return sendError(res, 400, "VALIDATION_ERROR", parsed.success ? "Invalid goal ID." : parsed.error.issues[0]?.message ?? "Invalid task.");
      }
      const goalId = new ObjectId(parsed.data.goalId);
      const goals = await getCollection<GoalRecord>("goals");
      const ownsGoal = await goals.countDocuments({ _id: goalId, userId }, { limit: 1 });
      if (!ownsGoal) return sendError(res, 404, "GOAL_NOT_FOUND", "Goal not found.");

      let milestoneId: ObjectId | null = null;
      if (parsed.data.milestoneId) {
        if (!ObjectId.isValid(parsed.data.milestoneId)) return sendError(res, 400, "INVALID_MILESTONE", "Invalid milestone ID.");
        milestoneId = new ObjectId(parsed.data.milestoneId);
        const milestones = await getCollection<MilestoneRecord>("milestones");
        const ownsMilestone = await milestones.countDocuments({ _id: milestoneId, userId, goalId }, { limit: 1 });
        if (!ownsMilestone) return sendError(res, 404, "MILESTONE_NOT_FOUND", "Milestone not found.");
      }

      const now = new Date();
      const record: TaskRecord = {
        userId,
        goalId,
        milestoneId,
        title: parsed.data.title,
        description: parsed.data.description,
        status: "todo",
        priority: parsed.data.priority,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        plannedDate: parsed.data.plannedDate ? new Date(parsed.data.plannedDate) : null,
        estimatedMinutes: parsed.data.estimatedMinutes,
        blockedReason: null,
        deferCount: 0,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
      };
      const result = await tasks.insertOne(record);
      return sendData(res, serializeTask({ _id: result.insertedId, ...record }), 201);
    }

    return sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
  } catch (error) {
    return handleApiError(res, error);
  }
}
