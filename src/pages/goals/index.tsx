import type React from "react";
import type { GetServerSideProps } from "next";
import { useState } from "react";
import { Alert, AppShell, Button, EmptyState, GoalCard, GoalForm, Modal } from "@/components";
import { useCreateGoal, useGoals } from "@/hooks";
import { requirePageAuth } from "@/lib";
import type { GoalValues } from "@/validation";

const GoalsPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { data: goals = [], error } = useGoals();
  const create = useCreateGoal();

  const submit = async (values: GoalValues) => {
    await create.mutateAsync(values);
    setOpen(false);
  };

  return (
    <AppShell title="Goals">
      <div className="flex flex-col gap-7">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-sm text-neutral-500">Direction</p><h2 className="mt-1 text-3xl font-semibold">Goals</h2></div>
          <Button onClick={() => setOpen(true)}>New goal</Button>
        </div>
        {error ? <Alert title="Goals unavailable" content="We couldn't load your goals." variant="destructive" /> : null}
        {goals.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{goals.map((goal) => <GoalCard key={goal.id} goal={goal} />)}</div>
        ) : (
          <EmptyState title="Set your first direction" description="Create a meaningful goal and Northstar will help turn it into milestones, tasks, and a clear next action." action="Create your first goal" onAction={() => setOpen(true)} />
        )}
        <Modal open={open} title="Create goal" onClose={() => setOpen(false)}>
          {create.error ? <div className="mb-4"><Alert title="Goal not created" content={create.error.message} variant="destructive" /></div> : null}
          <GoalForm submitLabel="Create goal" onSubmit={submit} />
        </Modal>
      </div>
    </AppShell>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => requirePageAuth(ctx);
export default GoalsPage;
