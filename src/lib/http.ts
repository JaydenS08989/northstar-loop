import type { ApiResponse } from "@/types";

export const apiFetch = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || "error" in payload) throw new Error("error" in payload ? payload.error.message : "Request failed.");
  return payload.data;
};
