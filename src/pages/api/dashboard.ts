import type { NextApiRequest, NextApiResponse } from "next";
import {
  getCollection,
  handleApiError,
  requireUserId,
  sendData,
  serializeGoal,
  serializeTask,
  type GoalRecord,
  type TaskRecord,
  type UserRecord,
} from "@/lib";
import type { ApiError, ApiSuccess, Goal, Task, TaskRecommendation } from "@/types";
import { rankTaskRecommendations } from "@/utils";

type Dashboard = { nextFocus: TaskRecommendation | null; goals: Goal[]; today: Task[]; attention: Task[] };
const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiSuccess<Dashboard> | ApiError>) {
  try {
    const userId = requireUserId(req);
    const requestedDate = typeof req.query.date === "string" && dateKeyPattern.test(req.query.date) ? req.query.date : null;
    const todayKey = requestedDate ?? new Date().toISOString().slice(0, 10);
    const [tasksCollection, goalsCollection, usersCollection] = await Promise.all([
      getCollection<TaskRecord>("tasks"),
      getCollection<GoalRecord>("goals"),
      getCollection<UserRecord>("users"),
    ]);
    const [taskRows, goalRows, user] = await Promise.all([
      tasksCollection.find({ userId, status: { $in: ["todo", "in_progress", "blocked"] } }).toArray(),
      goalsCollection.find({ userId, status: { $in: ["not_started", "in_progress"] } }).sort({ createdAt: -1 }).limit(6).toArray(),
      usersCollection.findOne({ clerkUserId: userId }),
    ]);
    const tasks = taskRows.map(serializeTask);
    const preferences = user?.planning ?? { dailyAvailableMinutes: 90, defaultFocusMinutes: 30, workingDays: [1, 2, 3, 4, 5], workStyle: "balanced" as const };
    const ranked = rankTaskRecommendations(tasks, preferences);
    return sendData(res, {
      nextFocus: ranked[0] ?? null,
      goals: goalRows.map(serializeGoal),
      today: tasks.filter((task) => task.plannedDate?.slice(0, 10) === todayKey),
      attention: tasks.filter((task) => task.status === "blocked" || (task.dueDate && task.dueDate.slice(0, 10) < todayKey)).slice(0, 5),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
