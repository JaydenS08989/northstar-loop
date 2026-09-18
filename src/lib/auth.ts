import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest } from "next";

export class UnauthorizedError extends Error {}
export const requireUserId = (req: NextApiRequest): string => {
  const { isAuthenticated, userId } = getAuth(req);
  if (!isAuthenticated || !userId) throw new UnauthorizedError("Unauthorized");
  return userId;
};
