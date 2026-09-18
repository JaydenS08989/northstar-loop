import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const model = process.env.OPENAI_MODEL ?? "gpt-5-mini";

const guidanceSchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(500),
  reason: z.string().min(1).max(300),
  suggestedActions: z.array(z.string().min(1).max(180)).max(8),
});
const milestoneSuggestionsSchema = z.object({
  milestones: z.array(z.object({ title: z.string().min(2).max(120), reason: z.string().min(1).max(240) })).min(1).max(6),
});
const taskBreakdownSchema = z.object({
  tasks: z.array(z.object({ title: z.string().min(2).max(160), estimatedMinutes: z.number().int().min(5).max(240), reason: z.string().min(1).max(240) })).min(1).max(8),
});
const replanSchema = z.object({
  summary: z.string().min(1).max(500),
  changes: z.array(z.object({ item: z.string().min(1).max(160), current: z.string().min(1).max(180), proposed: z.string().min(1).max(180), reason: z.string().min(1).max(280) })).max(8),
});

export type AiPlan = z.infer<typeof guidanceSchema>;
export type AiMilestoneSuggestions = z.infer<typeof milestoneSuggestionsSchema>;
export type AiTaskBreakdown = z.infer<typeof taskBreakdownSchema>;
export type AiReplan = z.infer<typeof replanSchema>;

const planningInstructions = [
  "You are Northstar, a concise planning assistant.",
  "Never make consequential changes; provide reviewable suggestions only.",
  "Use only the supplied planning context and do not infer sensitive personal information.",
  "Keep recommendations realistic, concrete, calm, and action-oriented.",
].join(" ");

export const requestPlanningGuidance = async (input: { goal: string; context: string; request: string }): Promise<AiPlan | null> => {
  if (!client) return null;
  try {
    const response = await client.responses.parse({
      model,
      instructions: planningInstructions,
      input: `Goal: ${input.goal}\nContext: ${input.context}\nRequest: ${input.request}`,
      text: { format: zodTextFormat(guidanceSchema, "northstar_guidance") },
    });
    return response.output_parsed ? guidanceSchema.parse(response.output_parsed) : null;
  } catch {
    return null;
  }
};

export const requestMilestoneSuggestions = async (input: { goal: string; why: string; successCriteria: string; targetDate: string }): Promise<AiMilestoneSuggestions | null> => {
  if (!client) return null;
  try {
    const response = await client.responses.parse({
      model,
      instructions: `${planningInstructions} Suggest a small ordered milestone sequence.`,
      input: `Goal: ${input.goal}\nWhy it matters: ${input.why}\nSuccess criteria: ${input.successCriteria}\nTarget date: ${input.targetDate}`,
      text: { format: zodTextFormat(milestoneSuggestionsSchema, "northstar_milestones") },
    });
    return response.output_parsed ? milestoneSuggestionsSchema.parse(response.output_parsed) : null;
  } catch {
    return null;
  }
};

export const requestTaskBreakdown = async (input: { goal: string; task: string; context: string }): Promise<AiTaskBreakdown | null> => {
  if (!client) return null;
  try {
    const response = await client.responses.parse({
      model,
      instructions: `${planningInstructions} Break one oversized task into independently actionable steps.`,
      input: `Goal: ${input.goal}\nTask: ${input.task}\nContext: ${input.context}`,
      text: { format: zodTextFormat(taskBreakdownSchema, "northstar_task_breakdown") },
    });
    return response.output_parsed ? taskBreakdownSchema.parse(response.output_parsed) : null;
  } catch {
    return null;
  }
};

export const requestReplan = async (input: { goal: string; context: string; preferences: string }): Promise<AiReplan | null> => {
  if (!client) return null;
  try {
    const response = await client.responses.parse({
      model,
      instructions: `${planningInstructions} Propose a recovery plan as explicit before-and-after changes. Do not claim the changes were applied.`,
      input: `Goal: ${input.goal}\nCurrent plan: ${input.context}\nPlanning preferences: ${input.preferences}`,
      text: { format: zodTextFormat(replanSchema, "northstar_replan") },
    });
    return response.output_parsed ? replanSchema.parse(response.output_parsed) : null;
  } catch {
    return null;
  }
};
