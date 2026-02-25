import { Subscription } from "../types";

export interface SubscriptionStats {
  active: number;
  pending: number;
  suspended: number;
  revenue: number;
}

export const calculateSubscriptionStats = (subscriptions: Subscription[]): SubscriptionStats => {
  return subscriptions.reduce(
    (acc, s) => {
      if (s.status === "active") {
        acc.active++;
        acc.revenue += s.monthly_fee || 0;
      } else if (s.status === "pending") {
        acc.pending++;
      } else if (s.status === "suspended") {
        acc.suspended++;
      }
      return acc;
    },
    { active: 0, pending: 0, suspended: 0, revenue: 0 }
  );
};
