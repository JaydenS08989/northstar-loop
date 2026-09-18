import type React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Milestone } from "@/types";
import { taskSchema, type TaskValues } from "@/validation";
import Button from "./Button";
import FormField from "./FormField";
import Input from "./Input";
import Textarea from "./Textarea";

type TaskFormProps = {
  goalId: string;
  milestones: Milestone[];
  initialValues?: TaskValues;
  submitLabel?: string;
  onSubmit: (values: TaskValues) => Promise<void>;
};

const TaskForm: React.FC<TaskFormProps> = ({ goalId, milestones, initialValues, submitLabel = "Add task", onSubmit }) => {
  const form = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: initialValues ?? {
      goalId,
      milestoneId: null,
      title: "",
      description: "",
      priority: "medium",
      dueDate: null,
      plannedDate: null,
      estimatedMinutes: 30,
    },
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FormField label="Task" htmlFor="task-title" error={form.formState.errors.title?.message}>
        <Input id="task-title" {...form.register("title")} autoFocus />
      </FormField>
      <FormField label="Notes" htmlFor="task-description" error={form.formState.errors.description?.message}>
        <Textarea id="task-description" {...form.register("description")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Milestone" htmlFor="task-milestone">
          <select id="task-milestone" className="min-h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm" {...form.register("milestoneId", { setValueAs: (value) => value || null })}>
            <option value="">No milestone</option>
            {milestones.map((milestone) => <option key={milestone.id} value={milestone.id}>{milestone.title}</option>)}
          </select>
        </FormField>
        <FormField label="Priority" htmlFor="task-priority">
          <select id="task-priority" className="min-h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm" {...form.register("priority")}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Due date" htmlFor="task-due"><Input id="task-due" type="date" {...form.register("dueDate")} /></FormField>
        <FormField label="Planned date" htmlFor="task-planned"><Input id="task-planned" type="date" {...form.register("plannedDate")} /></FormField>
        <FormField label="Minutes" htmlFor="task-minutes"><Input id="task-minutes" type="number" {...form.register("estimatedMinutes", { valueAsNumber: true })} /></FormField>
      </div>
      <Button type="submit" loading={form.formState.isSubmitting}>{submitLabel}</Button>
    </form>
  );
};

export default TaskForm;
