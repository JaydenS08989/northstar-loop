export type GoalStatus = "not_started" | "in_progress" | "completed" | "archived";
export type Priority = "low" | "medium" | "high";

export type Goal = {
  id: string;
  userId: string;
  title: string;
  description: string;
  successCriteria: string;
  priority: Priority;
  status: GoalStatus;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  archivedAt: string | null;
};
