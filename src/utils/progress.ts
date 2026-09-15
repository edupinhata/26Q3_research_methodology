import type { DeliverableStatus } from "./dates";

interface ProgressItem {
  status: DeliverableStatus;
}

export interface CourseProgress {
  completed: number;
  total: number;
  percentage: number;
}

const completedStatuses = new Set<DeliverableStatus>(["completed", "reviewed"]);

export function calculateProgress(items: readonly ProgressItem[]): CourseProgress {
  const total = items.length;
  const completed = items.filter(({ status }) => completedStatuses.has(status)).length;

  return {
    completed,
    total,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}
