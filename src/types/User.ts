export type PlanningPreferences = {
  dailyAvailableMinutes: number;
  defaultFocusMinutes: number;
  workingDays: number[];
  workStyle: "short" | "balanced" | "deep";
};

export type NotificationPreferences = {
  goalCompleted: boolean;
  milestoneCompleted: boolean;
  planningReminders: boolean;
};

export type UserProfile = {
  id: string;
  clerkUserId: string;
  displayName: string;
  email: string;
  onboardingCompleted: boolean;
  planning: PlanningPreferences;
  notifications: NotificationPreferences;
  createdAt: string;
  updatedAt: string;
};
