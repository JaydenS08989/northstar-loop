import type React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { milestoneSchema, type MilestoneValues } from "@/validation";
import Button from "./Button";
import FormField from "./FormField";
import Input from "./Input";
import Textarea from "./Textarea";

type MilestoneFormProps = {
  goalId: string;
  order: number;
  initialValues?: MilestoneValues;
  submitLabel?: string;
  onSubmit: (values: MilestoneValues) => Promise<void>;
};

const MilestoneForm: React.FC<MilestoneFormProps> = ({ goalId, order, initialValues, submitLabel = "Add milestone", onSubmit }) => {
  const form = useForm<MilestoneValues>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: initialValues ?? { goalId, title: "", description: "", targetDate: null, order },
  });
  return (
    <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FormField label="Milestone" htmlFor="milestone-title" error={form.formState.errors.title?.message}>
        <Input id="milestone-title" {...form.register("title")} autoFocus />
      </FormField>
      <FormField label="Description" htmlFor="milestone-description" error={form.formState.errors.description?.message}>
        <Textarea id="milestone-description" {...form.register("description")} />
      </FormField>
      <FormField label="Target date" htmlFor="milestone-date" error={form.formState.errors.targetDate?.message}>
        <Input id="milestone-date" type="date" {...form.register("targetDate")} />
      </FormField>
      <Button type="submit" loading={form.formState.isSubmitting}>{submitLabel}</Button>
    </form>
  );
};

export default MilestoneForm;
