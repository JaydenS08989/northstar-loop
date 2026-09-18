import type { PlanningPreferences, Task, TaskRecommendation } from "@/types";

const priorityPoints = { low: 8, medium: 18, high: 30 } as const;
const millisecondsPerDay = 86_400_000;

const calendarDay = (value: Date) => Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
const daysUntil = (isoDate: string, now: Date) => Math.round((calendarDay(new Date(isoDate)) - calendarDay(now)) / millisecondsPerDay);

export const scoreTaskRecommendation = (
  task: Task,
  preferences: PlanningPreferences,
  now = new Date(),
): TaskRecommendation => {
  const signals: TaskRecommendation["signals"] = [];
  let score = priorityPoints[task.priority];
  signals.push({ signal: "importance", points: priorityPoints[task.priority], reason: `${task.priority} priority` });

  if (task.dueDate) {
    const days = daysUntil(task.dueDate, now);
    const points = days < 0 ? 35 : days === 0 ? 28 : days <= 2 ? 20 : days <= 7 ? 10 : 0;
    if (points) {
      score += points;
      signals.push({
        signal: days < 0 ? "overdue" : "urgency",
        points,
        reason: days < 0 ? "Overdue" : `Due in ${days} day${days === 1 ? "" : "s"}`,
      });
    }
  }

  if (task.estimatedMinutes <= preferences.dailyAvailableMinutes) {
    score += 12;
    signals.push({ signal: "feasibility", points: 12, reason: "Fits your available time" });
  } else {
    score -= 8;
    signals.push({ signal: "feasibility", points: -8, reason: "May exceed today's available time" });
  }

  if (task.status === "in_progress") {
    score += 10;
    signals.push({ signal: "momentum", points: 10, reason: "Already in progress" });
  }
  if (task.status === "blocked" || task.status === "completed") score -= 1000;

  const reason = signals
    .filter((item) => item.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 2)
    .map((item) => item.reason)
    .join(" · ");

  return { task, score, signals, reason: reason || "Best available next action" };
};

export const rankTaskRecommendations = (tasks: Task[], preferences: PlanningPreferences) =>
  tasks.map((task) => scoreTaskRecommendation(task, preferences)).sort((a, b) => b.score - a.score);
