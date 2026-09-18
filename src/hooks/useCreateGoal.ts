import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, queryKeys } from "@/lib";
import type { Goal } from "@/types";
import type { GoalValues } from "@/validation";
export const useCreateGoal = () => { const queryClient = useQueryClient(); return useMutation({ mutationFn: (values: GoalValues) => apiFetch<Goal>("/api/goals", { method: "POST", body: JSON.stringify(values) }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: queryKeys.goals }); await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }); } }); };
