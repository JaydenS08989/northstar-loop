import type React from "react";
import type { GetServerSideProps } from "next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, AppShell, Button, Card, ProgressBar } from "@/components";
import { apiFetch, queryKeys, requirePageAuth } from "@/lib";
import type { Goal, Task, TaskRecommendation, UserProfile } from "@/types";

type Insights = { goalsCompleted: number; milestonesCompleted: number; tasksCompletedThisWeek: number; overdueTasks: number; openTasks: number };
type Dashboard = { nextFocus: TaskRecommendation | null; goals: Goal[]; today: Task[]; attention: Task[] };
type Replan = { summary: string; changes: Array<{ item: string; current: string; proposed: string; reason: string }> };

const InsightsPage: React.FC = () => {
  const insights = useQuery({ queryKey: queryKeys.insights, queryFn: () => apiFetch<Insights>("/api/insights") });
  const dashboard = useQuery({ queryKey: [...queryKeys.dashboard, "insights"], queryFn: () => apiFetch<Dashboard>("/api/dashboard") });
  const profile = useQuery({ queryKey: queryKeys.profile, queryFn: () => apiFetch<UserProfile>("/api/profile") });
  const replan = useMutation({
    mutationFn: async () => {
      const goal = dashboard.data?.goals[0];
      const attention = dashboard.data?.attention ?? [];
      const preferences = profile.data?.planning;
      return apiFetch<Replan>("/api/ai/replan", {
        method: "POST",
        body: JSON.stringify({
          goal: goal?.title ?? "Current active plan",
          context: [
            goal ? `Target date: ${goal.targetDate ?? "not set"}; success: ${goal.successCriteria}` : "No active goal details available.",
            `Tasks needing attention: ${attention.map((task) => `${task.title} (${task.status}, due ${task.dueDate ?? "not set"})`).join("; ") || "none"}`,
          ].join("\n"),
          preferences: preferences ? `${preferences.dailyAvailableMinutes} minutes/day; ${preferences.defaultFocusMinutes}-minute focus sessions; ${preferences.workStyle} work style` : "Standard planning preferences",
        }),
      });
    },
  });

  const data = insights.data;
  const completion = data && data.openTasks + data.tasksCompletedThisWeek > 0
    ? Math.round((data.tasksCompletedThisWeek / (data.openTasks + data.tasksCompletedThisWeek)) * 100)
    : 0;

  return (
    <AppShell title="Insights">
      <div className="flex flex-col gap-7">
        <div><p className="text-sm text-neutral-500">Progress</p><h2 className="mt-1 text-3xl font-semibold">Useful signals, not vanity metrics.</h2></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[["Tasks this week", data?.tasksCompletedThisWeek ?? 0], ["Goals completed", data?.goalsCompleted ?? 0], ["Milestones completed", data?.milestonesCompleted ?? 0], ["Overdue workload", data?.overdueTasks ?? 0]].map(([label, value]) => (
            <Card key={label}><p className="text-sm text-neutral-500">{label}</p><p className="mt-3 text-3xl font-semibold">{value}</p></Card>
          ))}
        </div>
        <Card><h3 className="mb-5 font-semibold">Weekly execution</h3><ProgressBar value={completion} label="Completed share of current workload" /></Card>

        {data?.overdueTasks ? <Alert title="This plan may need an adjustment" content={`${data.overdueTasks} overdue task${data.overdueTasks === 1 ? "" : "s"} may be creating avoidable schedule pressure. A recovery plan can suggest changes without applying anything automatically.`} variant="warning" /> : null}

        <Card className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Northstar replanning</p><h3 className="mt-2 text-xl font-semibold">Draft a realistic recovery plan.</h3><p className="mt-2 max-w-2xl text-sm text-neutral-600">Northstar reviews the active goal, workload pressure, and your planning preferences. Proposed changes are shown before anything is changed.</p></div>
            <Button type="button" variant="secondary" loading={replan.isPending} onClick={() => replan.mutate()}>Generate draft</Button>
          </div>
          {replan.isError ? <div className="mt-5"><Alert title="Replanning unavailable" content="Northstar couldn't generate a draft right now. Your existing plan is unchanged." variant="info" /></div> : null}
          {replan.data ? (
            <div className="mt-6 border-t border-neutral-200 pt-6">
              <p className="text-sm text-neutral-700">{replan.data.summary}</p>
              <div className="mt-4 space-y-3">
                {replan.data.changes.map((change, index) => (
                  <div key={`${change.item}-${index}`} className="rounded-xl border border-neutral-200 p-4">
                    <p className="font-medium">{change.item}</p>
                    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Current</p><p className="mt-1 text-neutral-600">{change.current}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Proposed</p><p className="mt-1 text-neutral-900">{change.proposed}</p></div></div>
                    <p className="mt-3 text-xs text-neutral-500">{change.reason}</p>
                  </div>
                ))}
              </div>
              <Alert title="Review before changing the plan" content="This is an advisory draft only. Northstar Loop has not changed dates, scope, milestones, or tasks." variant="info" />
            </div>
          ) : null}
        </Card>
      </div>
    </AppShell>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => requirePageAuth(ctx);
export default InsightsPage;
