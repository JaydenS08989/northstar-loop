import { ObjectId } from "mongodb";
import { z } from "zod";
import type { NextApiRequest, NextApiResponse } from "next";
import { getCollection, handleApiError, requireUserId, sendData, sendError, type FocusSessionRecord } from "@/lib";
import type { ApiError, ApiSuccess } from "@/types";
const schema = z.object({ taskId: z.string(), action: z.enum(["start", "end"]) });
export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiSuccess<{ id?: string; ok?: boolean }> | ApiError>) { try { const userId = requireUserId(req); if (req.method !== "POST") return sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed."); const p = schema.safeParse(req.body); if (!p.success || !ObjectId.isValid(p.data?.taskId ?? "")) return sendError(res, 400, "VALIDATION_ERROR", "Invalid focus session."); const c = await getCollection<FocusSessionRecord>("focusSessions"); const taskId = new ObjectId(p.data.taskId); if (p.data.action === "start") { const result = await c.insertOne({ userId, taskId, startedAt: new Date(), endedAt: null }); return sendData(res, { id: result.insertedId.toHexString() }, 201); } await c.updateOne({ userId, taskId, endedAt: null }, { $set: { endedAt: new Date() } }); return sendData(res, { ok: true }); } catch (error) { return handleApiError(res, error); } }
