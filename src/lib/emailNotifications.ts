import React from "react";
import { GoalCompletedEmail, MilestoneCompletedEmail, WelcomeEmail } from "@/emails";
import { resend, resendFrom } from "./resend";
import type { UserRecord } from "./records";
import { consumeRateLimit } from "./rateLimit";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type TransactionalMessage = { from: string; to: string; subject: string; react: React.ReactElement };

const safelySend = async (message: TransactionalMessage) => {
  if (!resend) return;
  try {
    await resend.emails.send(message);
  } catch (error) {
    console.error("Transactional email failed", error instanceof Error ? error.message : "Unknown email error");
  }
};

export const sendWelcomeEmail = async (user: Pick<UserRecord, "displayName" | "email">) => {
  if (!user.email) return;
  const limit = await consumeRateLimit(`email:welcome:${user.email}`, 2, 60 * 60 * 1000);
  if (!limit.allowed) return;
  await safelySend({
    from: resendFrom,
    to: user.email,
    subject: "Welcome to Northstar Loop",
    react: React.createElement(WelcomeEmail, { displayName: user.displayName, appUrl }),
  });
};

export const sendGoalCompletedEmail = async (
  user: Pick<UserRecord, "displayName" | "email" | "notifications">,
  goalTitle: string,
) => {
  if (!user.email || !user.notifications.goalCompleted) return;
  const limit = await consumeRateLimit(`email:goal:${user.email}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) return;
  await safelySend({
    from: resendFrom,
    to: user.email,
    subject: `Goal completed: ${goalTitle}`,
    react: React.createElement(GoalCompletedEmail, { displayName: user.displayName, goalTitle, appUrl }),
  });
};

export const sendMilestoneCompletedEmail = async (
  user: Pick<UserRecord, "displayName" | "email" | "notifications">,
  milestoneTitle: string,
  goalTitle: string,
  goalId: string,
) => {
  if (!user.email || !user.notifications.milestoneCompleted) return;
  const limit = await consumeRateLimit(`email:milestone:${user.email}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) return;
  await safelySend({
    from: resendFrom,
    to: user.email,
    subject: `Milestone completed: ${milestoneTitle}`,
    react: React.createElement(MilestoneCompletedEmail, {
      displayName: user.displayName,
      milestoneTitle,
      goalTitle,
      appUrl,
      goalId,
    }),
  });
};
