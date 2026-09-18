import { useQuery } from "@tanstack/react-query";
import { apiFetch, queryKeys } from "@/lib";
import type { Goal } from "@/types";
export const useGoals = () => useQuery({ queryKey: queryKeys.goals, queryFn: () => apiFetch<Goal[]>("/api/goals") });
