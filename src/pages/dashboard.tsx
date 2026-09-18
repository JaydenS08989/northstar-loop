import type React from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AppShell, Badge, Button, Card, GoalCard, TaskItem } from "@/components";
import { apiFetch, queryKeys, requirePageAuth } from "@/lib";
import type { Goal, Task, TaskRecommendation } from "@/types";
import { getLocalDateKey } from "@/utils";

type Dashboard = { nextFocus: TaskRecommendation | null; goals: Goal[]; today: Task[]; attention: Task[] };

const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const today = getLocalDateKey();
  const { data, error } = useQuery({ queryKey: [...queryKeys.dashboard, today], queryFn: () => apiFetch<Dashboard>(`/api/dashboard?date=${today}`) });
  const complete = useMutation({
    mutationFn: (task: Task) => apiFetch<Task>(`/api/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ status: "completed" }) }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks }),
        queryClient.invalidateQueries({ queryKey: queryKeys.insights }),
      ]);
    },
  });

  const recommendedTask = data?.nextFocus?.task;
  return (
    <AppShell title="Dashboard">
      <div className="flex flex-col gap-8">
        <div><p className="text-sm text-neutral-500">Your workspace</p><h2 className="mt-1 text-3xl font-semibold tracking-tight">What should you focus on next?</h2></div>
        {error ? <Alert title="Dashboard unavailable" content="We couldn't load your plan. Please refresh and try again." variant="destructive" /> : null}

        <Card className="border-black bg-black p-7 text-white md:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Next Focus</p>
          {data?.nextFocus ? (
            <div className="mt-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl"><h3 className="text-2xl font-semibold md:text-3xl">{data.nextFocus.task.title}</h3><p className="mt-3 text-sm text-neutral-300">{data.nextFocus.reason}</p></div>
                <Badge>{data.nextFocus.task.estimatedMinutes} min</Badge>
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={`/focus?task=${data.nextFocus.task.id}`}><Button className="bg-white text-black hover:bg-neutral-200">Start focus</Button></Link>
                <Button variant="ghost" className="text-white hover:bg-white/10" loading={complete.isPending} onClick={() => recommendedTask && complete.mutate(recommendedTask)}>Mark complete</Button>
              </div>
            </div>
          ) : (
            <div className="mt-5"><h3 className="text-2xl font-semibold">You're clear for now.</h3><p className="mt-2 text-sm text-neutral-400">Create a task or review an active goal to generate a next focus.</p></div>
          )}
        </Card>

        {data?.attention?.length ? <Alert title="A few items need attention" content={`${data.attention.length} open item${data.attention.length === 1 ? "" : "s"} are blocked or overdue. Review them before they create more pressure.`} variant="warning" /> : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Today's plan</h3><Link className="text-sm font-medium underline" href="/today">Open today</Link></div>
            {data?.today?.length ? data.today.map((task) => <TaskItem key={task.id} task={task} onComplete={(item) => complete.mutate(item)} />) : <p className="text-sm text-neutral-500">Nothing planned for today yet.</p>}
          </Card>
          <Card>
            <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Active goals</h3><Link className="text-sm font-medium underline" href="/goals">View all</Link></div>
            <div className="grid gap-3">{data?.goals?.slice(0, 2).map((goal) => <GoalCard key={goal.id} goal={goal} />)}</div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => requirePageAuth(ctx);
export default DashboardPage;
