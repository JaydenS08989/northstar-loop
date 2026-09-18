import { z } from "zod";

export const signInSchema = z.object({ email: z.string().email("Enter a valid email address."), password: z.string().min(8, "Password must be at least 8 characters.") });
export const signUpSchema = signInSchema.extend({ displayName: z.string().min(2, "Enter your name.").max(80) });
export const goalSchema = z.object({ title: z.string().min(2).max(120), description: z.string().max(1000).default(""), successCriteria: z.string().min(2).max(600), priority: z.enum(["low", "medium", "high"]), targetDate: z.string().nullable().optional() });
export const milestoneSchema = z.object({ goalId: z.string().min(1), title: z.string().min(2).max(120), description: z.string().max(800).default(""), targetDate: z.string().nullable().optional(), order: z.number().int().min(0).default(0) });
export const taskSchema = z.object({ goalId: z.string().min(1), milestoneId: z.string().nullable().optional(), title: z.string().min(2).max(160), description: z.string().max(1500).default(""), priority: z.enum(["low", "medium", "high"]).default("medium"), dueDate: z.string().nullable().optional(), plannedDate: z.string().nullable().optional(), estimatedMinutes: z.number().int().min(5).max(480).default(30) });
export const planningSchema = z.object({ dailyAvailableMinutes: z.number().int().min(15).max(720), defaultFocusMinutes: z.number().int().min(10).max(180), workingDays: z.array(z.number().int().min(0).max(6)).min(1), workStyle: z.enum(["short", "balanced", "deep"]) });
export const onboardingSchema = z.object({ title: z.string().min(2).max(120), why: z.string().min(2).max(500), targetDate: z.string().min(1), successCriteria: z.string().min(2).max(600), milestones: z.array(z.object({ title: z.string().min(2).max(120) })).min(1), dailyAvailableMinutes: z.number().int().min(15).max(720), defaultFocusMinutes: z.number().int().min(10).max(180), workingDays: z.array(z.number().int().min(0).max(6)).min(1, "Choose at least one working day."), workStyle: z.enum(["short", "balanced", "deep"]) });

export const forgotPasswordEmailSchema = z.object({ email: z.string().email("Enter a valid email address.") });
export const verificationCodeSchema = z.object({ code: z.string().min(6, "Enter the verification code.").max(12) });
export const newPasswordSchema = z.object({ password: z.string().min(8, "Password must be at least 8 characters.") });
export const profileSchema = z.object({ displayName: z.string().min(2, "Enter your name.").max(80) });
export const notificationSchema = z.object({ goalCompleted: z.boolean(), milestoneCompleted: z.boolean(), planningReminders: z.boolean() });
export const settingsSchema = z.object({ profile: profileSchema, planning: planningSchema, notifications: notificationSchema });

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type GoalValues = z.infer<typeof goalSchema>;
export type MilestoneValues = z.infer<typeof milestoneSchema>;
export type TaskValues = z.infer<typeof taskSchema>;
export type PlanningValues = z.infer<typeof planningSchema>;
export type OnboardingValues = z.infer<typeof onboardingSchema>;

export type ForgotPasswordEmailValues = z.infer<typeof forgotPasswordEmailSchema>;
export type VerificationCodeValues = z.infer<typeof verificationCodeSchema>;
export type NewPasswordValues = z.infer<typeof newPasswordSchema>;
export type SettingsValues = z.infer<typeof settingsSchema>;
