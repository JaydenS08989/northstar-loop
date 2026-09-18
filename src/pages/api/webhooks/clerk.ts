import type { NextApiRequest, NextApiResponse } from "next";
import { Webhook } from "svix";
import { getCollection, sendWelcomeEmail, type FocusSessionRecord, type GoalRecord, type MilestoneRecord, type TaskRecord, type UserRecord } from "@/lib";

type ClerkEvent = {
  type: string;
  data: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email_addresses?: Array<{ email_address: string; id: string }>;
    primary_email_address_id?: string | null;
    unsafe_metadata?: Record<string, unknown>;
  };
};

export const config = { api: { bodyParser: false } };

const readRawBody = async (req: NextApiRequest) => {
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks).toString("utf8");
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed." } });
  }
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) return res.status(500).json({ error: { code: "CONFIGURATION_ERROR", message: "Webhook is not configured." } });

  try {
    const payload = await readRawBody(req);
    const headers = {
      "svix-id": String(req.headers["svix-id"] ?? ""),
      "svix-timestamp": String(req.headers["svix-timestamp"] ?? ""),
      "svix-signature": String(req.headers["svix-signature"] ?? ""),
    };
    const event = new Webhook(secret).verify(payload, headers) as ClerkEvent;
    const users = await getCollection<UserRecord>("users");

    if (event.type === "user.deleted") {
      const [goals, milestones, tasks, focusSessions] = await Promise.all([
        getCollection<GoalRecord>("goals"),
        getCollection<MilestoneRecord>("milestones"),
        getCollection<TaskRecord>("tasks"),
        getCollection<FocusSessionRecord>("focusSessions"),
      ]);
      await Promise.all([
        users.deleteMany({ clerkUserId: event.data.id }),
        goals.deleteMany({ userId: event.data.id }),
        milestones.deleteMany({ userId: event.data.id }),
        tasks.deleteMany({ userId: event.data.id }),
        focusSessions.deleteMany({ userId: event.data.id }),
      ]);
      return res.status(200).json({ received: true });
    }

    if (event.type === "user.created" || event.type === "user.updated") {
      const email = event.data.email_addresses?.find((item) => item.id === event.data.primary_email_address_id)?.email_address
        ?? event.data.email_addresses?.[0]?.email_address
        ?? "";
      const metadataDisplayName = typeof event.data.unsafe_metadata?.displayName === "string"
        ? event.data.unsafe_metadata.displayName.trim()
        : "";
      const displayName = metadataDisplayName
        || [event.data.first_name, event.data.last_name].filter(Boolean).join(" ")
        || email.split("@")[0]
        || "Northstar user";
      const now = new Date();
      const defaults: Omit<UserRecord, "clerkUserId" | "displayName" | "email" | "updatedAt"> = {
        onboardingCompleted: false,
        planning: { dailyAvailableMinutes: 90, defaultFocusMinutes: 30, workingDays: [1, 2, 3, 4, 5], workStyle: "balanced" },
        notifications: { goalCompleted: true, milestoneCompleted: true, planningReminders: true },
        createdAt: now,
      };
      await users.updateOne(
        { clerkUserId: event.data.id },
        {
          $set: { displayName, email, updatedAt: now },
          $setOnInsert: { clerkUserId: event.data.id, ...defaults },
        },
        { upsert: true },
      );
      if (event.type === "user.created") await sendWelcomeEmail({ displayName, email });
    }

    return res.status(200).json({ received: true });
  } catch {
    return res.status(400).json({ error: { code: "INVALID_SIGNATURE", message: "Invalid webhook signature." } });
  }
}
