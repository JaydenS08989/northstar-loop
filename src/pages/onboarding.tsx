import type React from "react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";
import { Alert, Button, Card, FormField, Input, Logo, Textarea } from "@/components";
import { apiFetch, requirePageAuth } from "@/lib";
import { onboardingSchema, type OnboardingValues } from "@/validation";

type MilestoneSuggestions = { milestones: Array<{ title: string; reason: string }> };

const OnboardingPage: React.FC = () => {
  const router = useRouter();
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      title: "",
      why: "",
      targetDate: "",
      successCriteria: "",
      milestones: [{ title: "" }],
      dailyAvailableMinutes: 90,
      defaultFocusMinutes: 30,
      workingDays: [1, 2, 3, 4, 5],
      workStyle: "balanced",
    },
  });
  const milestones = useFieldArray({ control: form.control, name: "milestones" });
  const suggestions = useMutation({
    mutationFn: () => {
      const values = form.getValues();
      return apiFetch<MilestoneSuggestions>("/api/ai/milestones", {
        method: "POST",
        body: JSON.stringify({ goal: values.title, why: values.why, successCriteria: values.successCriteria, targetDate: values.targetDate }),
      });
    },
    onSuccess: (data) => {
      form.setValue("milestones", data.milestones.map(({ title }) => ({ title })), { shouldDirty: true, shouldValidate: true });
      form.clearErrors("root");
    },
    onError: () => form.setError("root", { message: "Northstar suggestions are temporarily unavailable. You can add milestones manually." }),
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await apiFetch<{ goalId: string }>("/api/onboarding", { method: "POST", body: JSON.stringify(values) });
      await router.push("/dashboard");
    } catch {
      form.setError("root", { message: "We couldn't create your initial plan. Please review the form and try again." });
    }
  });

  const suggestMilestones = async () => {
    const valid = await form.trigger(["title", "why", "targetDate", "successCriteria"]);
    if (valid) suggestions.mutate();
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <Logo />
        <Card className="mt-8 p-7 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">First plan</p>
          <h1 className="mt-3 text-3xl font-semibold">Turn one ambition into a workable plan.</h1>
          <p className="mt-2 text-sm text-neutral-600">Define the outcome, then shape milestones and a practical work rhythm. Every suggestion remains editable.</p>
          <form className="mt-8 flex flex-col gap-6" onSubmit={submit}>
            <FormField label="What do you want to accomplish?" htmlFor="title" error={form.formState.errors.title?.message}>
              <Input id="title" {...form.register("title")} />
            </FormField>
            <FormField label="Why does it matter?" htmlFor="why" error={form.formState.errors.why?.message}>
              <Textarea id="why" {...form.register("why")} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Target date" htmlFor="targetDate" error={form.formState.errors.targetDate?.message}>
                <Input id="targetDate" type="date" {...form.register("targetDate")} />
              </FormField>
              <FormField label="What does done look like?" htmlFor="success" error={form.formState.errors.successCriteria?.message}>
                <Input id="success" {...form.register("successCriteria")} />
              </FormField>
            </div>

            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div><p className="text-sm font-medium">Milestones</p><p className="mt-1 text-xs text-neutral-500">Build them yourself or ask Northstar for an editable starting point.</p></div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => milestones.append({ title: "" })}>Add milestone</Button>
                  <Button type="button" variant="secondary" loading={suggestions.isPending} onClick={() => void suggestMilestones()}>Suggest with Northstar</Button>
                </div>
              </div>
              <div className="space-y-3">
                {milestones.fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input aria-label={`Milestone ${index + 1}`} {...form.register(`milestones.${index}.title`)} />
                    {milestones.fields.length > 1 ? <Button type="button" variant="ghost" onClick={() => milestones.remove(index)} aria-label={`Remove milestone ${index + 1}`}>Remove</Button> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-6">
              <h2 className="text-lg font-semibold">Planning preferences</h2>
              <p className="mt-1 text-sm text-neutral-600">These keep recommendations realistic instead of merely urgent.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <FormField label="Minutes/day" htmlFor="daily" error={form.formState.errors.dailyAvailableMinutes?.message}>
                  <Input id="daily" type="number" {...form.register("dailyAvailableMinutes", { valueAsNumber: true })} />
                </FormField>
                <FormField label="Focus length" htmlFor="focus" error={form.formState.errors.defaultFocusMinutes?.message}>
                  <Input id="focus" type="number" {...form.register("defaultFocusMinutes", { valueAsNumber: true })} />
                </FormField>
                <FormField label="Work style" htmlFor="style" error={form.formState.errors.workStyle?.message}>
                  <select id="style" className="min-h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-neutral-200" {...form.register("workStyle")}>
                    <option value="short">Short</option><option value="balanced">Balanced</option><option value="deep">Deep</option>
                  </select>
                </FormField>
              </div>
              <fieldset className="mt-5">
                <legend className="text-sm font-medium">Working days</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    [1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [0, "Sun"],
                  ].map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        value={value}
                        className="size-4 accent-black"
                        {...form.register("workingDays", { valueAsNumber: true })}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {form.formState.errors.workingDays?.message ? <p className="mt-2 text-xs text-red-700">{form.formState.errors.workingDays.message}</p> : null}
              </fieldset>
            </div>

            {form.formState.errors.root ? <Alert title="Plan needs attention" content={form.formState.errors.root.message ?? "Please review the form."} variant="warning" /> : null}
            <Button className="h-12" type="submit" loading={form.formState.isSubmitting}>Create my initial plan</Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => requirePageAuth(ctx);
export default OnboardingPage;
