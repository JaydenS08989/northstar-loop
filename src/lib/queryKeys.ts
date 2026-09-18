export const queryKeys = {
  dashboard: ["dashboard"] as const,
  goals: ["goals"] as const,
  goal: (id: string) => ["goals", id] as const,
  tasks: ["tasks"] as const,
  profile: ["profile"] as const,
  insights: ["insights"] as const,
};
