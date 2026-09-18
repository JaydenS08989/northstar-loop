import type React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { goalSchema, type GoalValues } from "@/validation";
import Button from "./Button";
import FormField from "./FormField";
import Input from "./Input";
import Textarea from "./Textarea";

type GoalFormProps = {
  initialValues?: GoalValues;
  submitLabel?: string;
  onSubmit: (values: GoalValues) => Promise<void>;
};

const GoalForm: React.FC<GoalFormProps> = ({ initialValues, submitLabel = "Save goal", onSubmit }) => {
  const form = useForm<GoalValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: initialValues ?? {
      title: "",
      description: "",
      successCriteria: "",
      priority: "medium",
      targetDate: null,
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FormField label="What do you want to accomplish?" htmlFor="goal-title" error={form.formState.errors.title?.message}>
        <Input id="goal-title" {...form.register("title")} autoFocus />
      </FormField>
      <FormField label="Why does it matter?" htmlFor="goal-description" error={form.formState.errors.description?.message}>
        <Textarea id="goal-description" {...form.register("description")} />
      </FormField>
      <FormField label="What does done look like?" htmlFor="goal-success" error={form.formState.errors.successCriteria?.message}>
        <Textarea id="goal-success" {...form.register("successCriteria")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Priority" htmlFor="goal-priority">
          <select id="goal-priority" className="min-h-11 rounded-lg border border-neutral-300 bg-white px-3 text-sm" {...form.register("priority")}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </FormField>
        <FormField label="Target date" htmlFor="goal-target-date">
          <Input id="goal-target-date" type="date" {...form.register("targetDate")} />
        </FormField>
      </div>
      <Button type="submit" loading={form.formState.isSubmitting}>{submitLabel}</Button>
    </form>
  );
};

export default GoalForm;
