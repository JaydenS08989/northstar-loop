import type { Priority } from "@/types/Goal";

export type TaskStatus = "todo" | "in_progress" | "completed" | "blocked";
export type Task = {
  id: string;
  userId: string;
  goalId: string;
  milestoneId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  plannedDate: string | null;
  estimatedMinutes: number;
  blockedReason: string | null;
  deferCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};
