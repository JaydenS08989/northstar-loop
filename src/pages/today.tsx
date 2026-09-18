import type React from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, Button, Card, EmptyState, TaskItem } from "@/components";
import { apiFetch, queryKeys, requirePageAuth } from "@/lib";
import type { Task } from "@/types";
import { getLocalDateKey } from "@/utils";

const TodayPage: React.FC = () => {
  const queryClient = useQueryClient();
  const today = getLocalDateKey();
  const { data: tasks = [] } = useQuery({ queryKey: [...queryKeys.tasks, "today", today], queryFn: () => apiFetch<Task[]>("/api/tasks") });
  const open = tasks.filter((task) => task.status !== "completed");
  const planned = open.filter((task) => task.plannedDate?.slice(0, 10) === today);
  const overdue = open.filter((task) => task.dueDate && task.dueDate.slice(0, 10) < today);
  const completed = tasks.filter((task) => task.completedAt?.slice(0, 10) === today);

  const update = useMutation({
    mutationFn: ({ task, body }: { task: Task; body: Record<string, unknown> }) => apiFetch<Task>(`/api/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.insights }),
      ]);
    },
  });

  const tomorrow = () => {
    const value = new Date();
    value.setDate(value.getDate() + 1);
    return getLocalDateKey(value);
  };

  return (
    <AppShell title="Today">
      <div className="flex flex-col gap-7">
        <div><p className="text-sm text-neutral-500">Execution</p><h2 className="mt-1 text-3xl font-semibold">Today</h2></div>
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs uppercase tracking-wider text-neutral-500">Primary focus</p><h3 className="mt-2 text-xl font-semibold">{planned[0]?.title ?? open[0]?.title ?? "Nothing urgent right now"}</h3></div>
            {planned[0] || open[0] ? <Link href={`/focus?task=${(planned[0] ?? open[0])?.id}`}><Button>Start focus</Button></Link> : null}
          </div>
        </Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="mb-4 font-semibold">Planned for today</h3>
            {planned.length ? planned.map((task) => <TaskItem key={task.id} task={task} onComplete={(item) => update.mutate({ task: item, body: { status: "completed" } })} onReschedule={(item) => update.mutate({ task: item, body: { plannedDate: tomorrow() } })} />) : <EmptyState title="You're clear for today" description="Add a task or review what comes next." />}
          </Card>
          <Card>
            <h3 className="mb-4 font-semibold">Needs attention</h3>
            {overdue.length ? overdue.map((task) => <TaskItem key={task.id} task={task} onComplete={(item) => update.mutate({ task: item, body: { status: "completed" } })} onReschedule={(item) => update.mutate({ task: item, body: { plannedDate: tomorrow() } })} />) : <p className="text-sm text-neutral-500">No overdue work.</p>}
          </Card>
        </div>
        <Card>
          <h3 className="mb-4 font-semibold">Completed today</h3>
          {completed.length ? completed.map((task) => <TaskItem key={task.id} task={task} onReopen={(item) => update.mutate({ task: item, body: { status: "todo" } })} />) : <p className="text-sm text-neutral-500">Completed work will appear here.</p>}
        </Card>
      </div>
    </AppShell>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => requirePageAuth(ctx);
export default TodayPage;
