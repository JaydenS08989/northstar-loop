import type React from "react";
import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AppShell, Button, Card } from "@/components";
import { apiFetch, queryKeys, requirePageAuth } from "@/lib";
import { beginFocusSession, endFocusSession, tick, useAppDispatch, useAppSelector } from "@/store";
import type { Goal, Task } from "@/types";

type Guidance = { title: string; summary: string; reason: string; suggestedActions: string[]; source: "ai" | "fallback" };

const FocusPage: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const taskId = typeof router.query.task === "string" ? router.query.task : "";
  const { data: tasks = [] } = useQuery({ queryKey: ["focusTasks"], queryFn: () => apiFetch<Task[]>("/api/tasks?status=open") });
  const task = tasks.find((item) => item.id === taskId) ?? tasks[0];
  const goal = useQuery({
    queryKey: queryKeys.goal(task?.goalId ?? ""),
    queryFn: () => apiFetch<Goal>(`/api/goals/${task?.goalId ?? ""}`),
    enabled: Boolean(task?.goalId),
  });
  const dispatch = useAppDispatch();
  const focus = useAppSelector((state) => state.focus);
  const [guidance, setGuidance] = useState<Guidance | null>(null);

  useEffect(() => {
    if (focus.status !== "running") return;
    const timerId = window.setInterval(() => dispatch(tick()), 1000);
    return () => window.clearInterval(timerId);
  }, [dispatch, focus.status]);

  const refreshTasks = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["focusTasks"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    ]);
  };

  const updateTask = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => apiFetch<Task>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: refreshTasks,
  });

  const askNorthstar = useMutation({
    mutationFn: (request: string) => apiFetch<Guidance>("/api/ai/guidance", {
      method: "POST",
      body: JSON.stringify({
        goal: goal.data?.title ?? "Complete the current task",
        context: task ? `${task.title}. ${task.description}. Estimated ${task.estimatedMinutes} minutes.` : "No selected task.",
        request,
      }),
    }),
    onSuccess: setGuidance,
  });

  const finishTask = async (status: "completed" | "blocked") => {
    if (!task) return;
    await updateTask.mutateAsync({ id: task.id, body: status === "blocked" ? { status, blockedReason: "Blocked during focus session" } : { status } });
    if (focus.status !== "idle") await dispatch(endFocusSession(task.id));
    await router.push("/today");
  };

  const skip = async () => {
    if (!task) return;
    if (focus.status !== "idle") await dispatch(endFocusSession(task.id));
    await router.push("/today");
  };

  const minutes = Math.floor(focus.elapsedSeconds / 60).toString().padStart(2, "0");
  const seconds = (focus.elapsedSeconds % 60).toString().padStart(2, "0");

  return (
    <AppShell title="Focus">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <Card className="p-8 md:p-12">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Focus mode</p>
          {task ? (
            <div className="mt-8 text-center">
              <p className="text-sm text-neutral-500">{goal.data?.title ?? "Current goal"}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{task.title}</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-600">{task.description || "Stay with one concrete action until the session ends."}</p>
              <div className="my-10 text-6xl font-semibold tabular-nums tracking-tight">{minutes}:{seconds}</div>
              <div className="flex flex-wrap justify-center gap-3">
                {focus.status === "idle" ? <Button onClick={() => void dispatch(beginFocusSession(task.id))}>Start session</Button> : <Button onClick={() => void dispatch(endFocusSession(task.id))}>End session</Button>}
                <Button variant="secondary" onClick={() => void finishTask("completed")} loading={updateTask.isPending}>Complete</Button>
                <Button variant="ghost" onClick={() => void finishTask("blocked")}>Blocked</Button>
                <Button variant="ghost" onClick={() => void skip()}>Skip for now</Button>
              </div>
            </div>
          ) : <Alert title="No task selected" content="Choose an open task from Today or Dashboard to begin a focus session." />}
        </Card>

        {task ? (
          <Card className="p-6">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Ask Northstar</p><h3 className="mt-2 text-lg font-semibold">Get unstuck without leaving focus mode.</h3></div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Break this into smaller steps.", "What is the first concrete action?", "I only have 20 minutes. What should I do?", "Help me get unstuck."].map((request) => (
                <Button key={request} type="button" variant="secondary" onClick={() => askNorthstar.mutate(request)} loading={askNorthstar.isPending}>{request}</Button>
              ))}
            </div>
            {guidance ? <div className="mt-5"><Alert title={guidance.title} content={<div><p>{guidance.summary}</p><ul className="mt-2 list-disc space-y-1 pl-5">{guidance.suggestedActions.map((action) => <li key={action}>{action}</li>)}</ul>{guidance.source === "fallback" ? <p className="mt-2 text-xs text-neutral-500">AI guidance is temporarily unavailable; this is fallback planning guidance.</p> : null}</div>} variant="info" /></div> : null}
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => requirePageAuth(ctx);
export default FocusPage;
