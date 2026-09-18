import type { Milestone, Task } from "@/types";

export const calculateGoalProgress = (milestones: Milestone[], tasks: Task[]): number => {
  const milestoneWeight = milestones.length > 0 ? 0.6 : 0;
  const taskWeight = tasks.length > 0 ? 1 - milestoneWeight : 0;
  if (milestoneWeight + taskWeight === 0) return 0;
  const milestoneRatio = milestones.length ? milestones.filter((item) => item.status === "completed").length / milestones.length : 0;
  const taskRatio = tasks.length ? tasks.filter((item) => item.status === "completed").length / tasks.length : 0;
  return Math.round(((milestoneRatio * milestoneWeight + taskRatio * taskWeight) / (milestoneWeight + taskWeight)) * 100);
};
