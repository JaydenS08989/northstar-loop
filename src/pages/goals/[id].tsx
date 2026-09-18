import type React from "react";
import { useState } from "react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Alert,
  AppShell,
  Badge,
  Button,
  Card,
  GoalForm,
  MilestoneForm,
  Modal,
  ProgressBar,
  TaskForm,
  TaskItem,
} from "@/components";
import { apiFetch, queryKeys, requirePageAuth } from "@/lib";
import type { Goal, Milestone, Task } from "@/types";
import type { GoalValues, MilestoneValues, TaskValues } from "@/validation";
import { calculateGoalProgress, formatDate } from "@/utils";

const GoalDetailsPage: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const [goalEditOpen, setGoalEditOpen] = useState(false);
  const [milestoneModal, setMilestoneModal] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const goal = useQuery({ queryKey: queryKeys.goal(id), queryFn: () => apiFetch<Goal>(`/api/goals/${id}`), enabled: Boolean(id) });
  const milestones = useQuery({ queryKey: ["milestones", id], queryFn: () => apiFetch<Milestone[]>(`/api/milestones?goalId=${id}`), enabled: Boolean(id) });
  const tasks = useQuery({ queryKey: ["tasks", id], queryFn: () => apiFetch<Task[]>(`/api/tasks?goalId=${id}`), enabled: Boolean(id) });
  const progress = calculateGoalProgress(milestones.data ?? [], tasks.data ?? []);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.goal(id) }),
      queryClient.invalidateQueries({ queryKey: ["milestones", id] }),
      queryClient.invalidateQueries({ queryKey: ["tasks", id] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      queryClient.invalidateQueries({ queryKey: queryKeys.goals }),
    ]);
  };

  const updateGoalStatus = useMutation({
    mutationFn: (status: Goal["status"]) => apiFetch<Goal>(`/api/goals/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: refresh,
  });
  const deleteGoal = useMutation({
    mutationFn: () => apiFetch<{ deleted: true }>(`/api/goals/${id}`, { method: "DELETE" }),
    onSuccess: async () => router.push("/goals"),
  });
  const completeTask = useMutation({
    mutationFn: (task: Task) => apiFetch<Task>(`/api/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ status: "completed" }) }),
    onSuccess: refresh,
  });
  const completeMilestone = useMutation({
    mutationFn: (milestone: Milestone) => apiFetch<Milestone>(`/api/milestones/${milestone.id}`, { method: "PATCH", body: JSON.stringify({ status: "completed" }) }),
    onSuccess: refresh,
  });

  const saveGoal = async (values: GoalValues) => {
    await apiFetch<Goal>(`/api/goals/${id}`, { method: "PATCH", body: JSON.stringify(values) });
    setGoalEditOpen(false);
    await refresh();
  };
  const createMilestone = async (values: MilestoneValues) => {
    await apiFetch<Milestone>("/api/milestones", { method: "POST", body: JSON.stringify(values) });
    setMilestoneModal(false);
    await refresh();
  };
  const saveMilestone = async (values: MilestoneValues) => {
    if (!editingMilestone) return;
    await apiFetch<Milestone>(`/api/milestones/${editingMilestone.id}`, { method: "PATCH", body: JSON.stringify(values) });
    setEditingMilestone(null);
    await refresh();
  };
  const createTask = async (values: TaskValues) => {
    await apiFetch<Task>("/api/tasks", { method: "POST", body: JSON.stringify(values) });
    setTaskModal(false);
    await refresh();
  };
  const saveTask = async (values: TaskValues) => {
    if (!editingTask) return;
    const { goalId: _goalId, ...patch } = values;
    await apiFetch<Task>(`/api/tasks/${editingTask.id}`, { method: "PATCH", body: JSON.stringify(patch) });
    setEditingTask(null);
    await refresh();
  };
  const deleteMilestone = async (milestone: Milestone) => {
    if (!window.confirm(`Delete milestone “${milestone.title}”? Its tasks will remain attached to the goal.`)) return;
    await apiFetch<{ deleted: true }>(`/api/milestones/${milestone.id}`, { method: "DELETE" });
    await refresh();
  };
  const deleteTask = async (task: Task) => {
    if (!window.confirm(`Delete task “${task.title}”?`)) return;
    await apiFetch<{ deleted: true }>(`/api/tasks/${task.id}`, { method: "DELETE" });
    await refresh();
  };

  return (
    <AppShell title="Goal">
      <div className="flex flex-col gap-7">
        {goal.error ? <Alert title="Goal unavailable" content="We couldn't load this goal." variant="destructive" /> : null}
        {goal.data ? (
          <>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge>{goal.data.priority}</Badge>
                  <Badge tone={goal.data.status === "completed" ? "success" : "neutral"}>{goal.data.status.replaceAll("_", " ")}</Badge>
                  <span className="text-sm text-neutral-500">Target {formatDate(goal.data.targetDate)}</span>
                </div>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight">{goal.data.title}</h2>
                <p className="mt-3 max-w-3xl text-neutral-600">{goal.data.description}</p>
                <p className="mt-3 max-w-3xl text-sm text-neutral-500"><strong className="text-neutral-700">Done looks like:</strong> {goal.data.successCriteria}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => setGoalEditOpen(true)}><Pencil className="size-4" />Edit</Button>
                {goal.data.status !== "completed" ? <Button type="button" onClick={() => updateGoalStatus.mutate("completed")} loading={updateGoalStatus.isPending}><Check className="size-4" />Complete</Button> : null}
                {goal.data.status !== "archived" ? <Button type="button" variant="secondary" onClick={() => updateGoalStatus.mutate("archived")}>Archive</Button> : null}
                <Button type="button" variant="destructive" onClick={() => { if (window.confirm("Delete this goal and its milestones and tasks? This cannot be undone.")) deleteGoal.mutate(); }} loading={deleteGoal.isPending}><Trash2 className="size-4" />Delete</Button>
              </div>
            </div>

            <Card><ProgressBar value={progress} label="Overall progress" /></Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-semibold">Milestones</h3><Button type="button" variant="secondary" onClick={() => setMilestoneModal(true)}><Plus className="size-4" />Add</Button></div>
                <div className="space-y-3">
                  {milestones.data?.length ? milestones.data.map((milestone) => (
                    <div key={milestone.id} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3">
                      <div><p className="text-sm font-medium">{milestone.title}</p><p className="text-xs text-neutral-500">{formatDate(milestone.targetDate)}</p></div>
                      <div className="flex items-center gap-1">
                        <Badge tone={milestone.status === "completed" ? "success" : "neutral"}>{milestone.status.replaceAll("_", " ")}</Badge>
                        {milestone.status !== "completed" ? <button type="button" className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-black" aria-label={`Complete ${milestone.title}`} onClick={() => completeMilestone.mutate(milestone)}><Check className="size-4" /></button> : null}
                        <button type="button" className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-black" aria-label={`Edit ${milestone.title}`} onClick={() => setEditingMilestone(milestone)}><Pencil className="size-4" /></button>
                        <button type="button" className="rounded-md p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-700" aria-label={`Delete ${milestone.title}`} onClick={() => void deleteMilestone(milestone)}><Trash2 className="size-4" /></button>
                      </div>
                    </div>
                  )) : <p className="text-sm text-neutral-500">No milestones yet.</p>}
                </div>
              </Card>

              <Card>
                <div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-semibold">Tasks</h3><Button type="button" variant="secondary" onClick={() => setTaskModal(true)}><Plus className="size-4" />Add</Button></div>
                {tasks.data?.length ? tasks.data.map((task) => <TaskItem key={task.id} task={task} onComplete={(item) => completeTask.mutate(item)} onEdit={setEditingTask} onDelete={(item) => void deleteTask(item)} />) : <p className="text-sm text-neutral-500">No tasks yet.</p>}
              </Card>
            </div>
          </>
        ) : null}
      </div>

      {goal.data ? <Modal open={goalEditOpen} onClose={() => setGoalEditOpen(false)} title="Edit goal"><GoalForm initialValues={{ title: goal.data.title, description: goal.data.description, successCriteria: goal.data.successCriteria, priority: goal.data.priority, targetDate: goal.data.targetDate?.slice(0, 10) ?? null }} submitLabel="Save goal" onSubmit={saveGoal} /></Modal> : null}
      <Modal open={milestoneModal} onClose={() => setMilestoneModal(false)} title="Add milestone"><MilestoneForm goalId={id} order={milestones.data?.length ?? 0} onSubmit={createMilestone} /></Modal>
      {editingMilestone ? <Modal open title="Edit milestone" onClose={() => setEditingMilestone(null)}><MilestoneForm goalId={id} order={editingMilestone.order} initialValues={{ goalId: id, title: editingMilestone.title, description: editingMilestone.description, targetDate: editingMilestone.targetDate?.slice(0, 10) ?? null, order: editingMilestone.order }} submitLabel="Save milestone" onSubmit={saveMilestone} /></Modal> : null}
      <Modal open={taskModal} onClose={() => setTaskModal(false)} title="Add task"><TaskForm goalId={id} milestones={milestones.data ?? []} onSubmit={createTask} /></Modal>
      {editingTask ? <Modal open title="Edit task" onClose={() => setEditingTask(null)}><TaskForm goalId={id} milestones={milestones.data ?? []} initialValues={{ goalId: id, milestoneId: editingTask.milestoneId, title: editingTask.title, description: editingTask.description, priority: editingTask.priority, dueDate: editingTask.dueDate?.slice(0, 10) ?? null, plannedDate: editingTask.plannedDate?.slice(0, 10) ?? null, estimatedMinutes: editingTask.estimatedMinutes }} submitLabel="Save task" onSubmit={saveTask} /></Modal> : null}
    </AppShell>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => requirePageAuth(ctx);
export default GoalDetailsPage;
