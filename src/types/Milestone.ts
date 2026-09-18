export type MilestoneStatus = "not_started" | "in_progress" | "completed";
export type Milestone = {
  id: string;
  userId: string;
  goalId: string;
  title: string;
  description: string;
  targetDate: string | null;
  status: MilestoneStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};
