import assert from "node:assert/strict";
import test from "node:test";
import { calculateGoalProgress } from "./calculateGoalProgress.ts";

const milestone = (status: "not_started" | "in_progress" | "completed") => ({ status });
const task = (status: "todo" | "in_progress" | "completed" | "blocked") => ({ status });

test("returns zero when there is no completion data", () => {
  assert.equal(calculateGoalProgress([], []), 0);
});

test("weights milestones at sixty percent when milestones and tasks exist", () => {
  const result = calculateGoalProgress(
    [milestone("completed"), milestone("not_started")] as never,
    [task("completed"), task("completed")] as never,
  );
  assert.equal(result, 70);
});

test("uses task completion alone when there are no milestones", () => {
  const result = calculateGoalProgress([], [task("completed"), task("todo")] as never);
  assert.equal(result, 50);
});
