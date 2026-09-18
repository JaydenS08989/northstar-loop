import assert from "node:assert/strict";
import test from "node:test";
import { rankTaskRecommendations, scoreTaskRecommendation } from "./scoreTaskRecommendation.ts";

const preferences = { dailyAvailableMinutes: 60, defaultFocusMinutes: 30, workingDays: [1, 2, 3, 4, 5], workStyle: "balanced" as const };
const baseTask = {
  id: "task", userId: "user", goalId: "goal", milestoneId: null, title: "Task", description: "",
  status: "todo" as const, priority: "medium" as const, dueDate: null, plannedDate: null,
  estimatedMinutes: 30, blockedReason: null, deferCount: 0,
  createdAt: "2026-09-18T00:00:00.000Z", updatedAt: "2026-09-18T00:00:00.000Z", completedAt: null,
};

test("raises overdue work above otherwise equal work", () => {
  const now = new Date("2026-09-18T12:00:00.000Z");
  const overdue = scoreTaskRecommendation({ ...baseTask, id: "overdue", dueDate: "2026-09-17T00:00:00.000Z" }, preferences, now);
  const undated = scoreTaskRecommendation({ ...baseTask, id: "undated" }, preferences, now);
  assert.ok(overdue.score > undated.score);
});

test("deprioritizes blocked tasks", () => {
  const ranked = rankTaskRecommendations([
    { ...baseTask, id: "blocked", priority: "high", status: "blocked" },
    { ...baseTask, id: "ready", priority: "low" },
  ], preferences);
  assert.equal(ranked[0]?.task.id, "ready");
});
