import { useQuery } from "@tanstack/react-query";
import { apiFetch, queryKeys } from "@/lib";
import type { Task } from "@/types";
export const useTasks = (params = "") => useQuery({ queryKey: [...queryKeys.tasks, params], queryFn: () => apiFetch<Task[]>(`/api/tasks${params ? `?${params}` : ""}`) });
