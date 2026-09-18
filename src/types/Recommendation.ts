import type { Task } from "@/types/Task";

export type RecommendationSignal = "urgency" | "importance" | "overdue" | "feasibility" | "momentum";
export type TaskRecommendation = {
  task: Task;
  score: number;
  signals: Array<{ signal: RecommendationSignal; points: number; reason: string }>;
  reason: string;
};
