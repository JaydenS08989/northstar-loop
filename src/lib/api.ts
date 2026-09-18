import type { NextApiResponse } from "next";
import type { ApiError, ApiSuccess } from "@/types";
import { UnauthorizedError } from "./auth";

export const sendData = <T>(res: NextApiResponse<ApiSuccess<T> | ApiError>, data: T, status = 200) => res.status(status).json({ data });
export const sendError = (res: NextApiResponse<ApiError>, status: number, code: string, message: string) => res.status(status).json({ error: { code, message } });
export const handleApiError = (res: NextApiResponse<ApiError>, error: unknown) => {
  if (error instanceof UnauthorizedError) return sendError(res, 401, "UNAUTHORIZED", "Sign in to continue.");
  console.error("API request failed", error instanceof Error ? error.message : "Unknown error");
  return sendError(res, 500, "INTERNAL_ERROR", "We couldn't complete that request. Please try again.");
};
