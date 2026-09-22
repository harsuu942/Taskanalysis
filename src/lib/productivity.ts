import { Task, DailyProductivityStats } from "@/types";

export function isSameDay(d1: Date | string, d2: Date | string): boolean {
  const date1 = typeof d1 === "string" ? new Date(d1) : d1;
  const date2 = typeof d2 === "string" ? new Date(d2) : d2;
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isDateInWeek(dateStrOrObj: Date | string, refDate: Date = new Date()): boolean {
  const d = typeof dateStrOrObj === "string" ? new Date(dateStrOrObj) : dateStrOrObj;
  if (isNaN(d.getTime())) return false;

  // Start of week (Monday)
  const ref = new Date(refDate);
  const day = ref.getDay(); // 0 is Sunday
  const diffToMonday = ref.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(ref.setDate(diffToMonday));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return d.getTime() >= monday.getTime() && d.getTime() <= sunday.getTime();
}

export function isDateInMonth(dateStrOrObj: Date | string, refDate: Date = new Date()): boolean {
  const d = typeof dateStrOrObj === "string" ? new Date(dateStrOrObj) : dateStrOrObj;
  if (isNaN(d.getTime())) return false;
  return d.getFullYear() === refDate.getFullYear() && d.getMonth() === refDate.getMonth();
}

export type TaskDateFilterOption =
  | "ALL"
  | "TODAY"
  | "YESTERDAY"
  | "THIS_WEEK"
  | "THIS_MONTH"
  | "CUSTOM";

export function matchesTaskDateFilter(
  task: Task,
  filter: TaskDateFilterOption,
  customDate?: string
): boolean {
  if (filter === "ALL") return true;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  // Helper to check against single date
  const checkAgainstDay = (target: Date) => {
    if (task.dueDate && isSameDay(task.dueDate, target)) return true;
    if (task.startDate && isSameDay(task.startDate, target)) return true;
    if (task.timeLogs && task.timeLogs.some((l) => isSameDay(l.startTime, target))) return true;
    if (!task.dueDate && !task.startDate && task.createdAt && isSameDay(task.createdAt, target)) return true;
    return false;
  };

  if (filter === "TODAY") {
    return checkAgainstDay(today);
  }

  if (filter === "YESTERDAY") {
    return checkAgainstDay(yesterday);
  }

  if (filter === "THIS_WEEK") {
    if (task.dueDate && isDateInWeek(task.dueDate, now)) return true;
    if (task.startDate && isDateInWeek(task.startDate, now)) return true;
    if (task.timeLogs && task.timeLogs.some((l) => isDateInWeek(l.startTime, now))) return true;
    if (!task.dueDate && !task.startDate && task.createdAt && isDateInWeek(task.createdAt, now)) return true;
    return false;
  }

  if (filter === "THIS_MONTH") {
    if (task.dueDate && isDateInMonth(task.dueDate, now)) return true;
    if (task.startDate && isDateInMonth(task.startDate, now)) return true;
    if (task.timeLogs && task.timeLogs.some((l) => isDateInMonth(l.startTime, now))) return true;
    if (!task.dueDate && !task.startDate && task.createdAt && isDateInMonth(task.createdAt, now)) return true;
    return false;
  }

  if (filter === "CUSTOM" && customDate) {
    const parts = customDate.split("-");
    if (parts.length === 3) {
      const target = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return checkAgainstDay(target);
    }
  }

  return true;
}

export function computeDailyProductivity(
  tasks: Task[],
  targetDate: Date
): DailyProductivityStats {
  const targetYear = targetDate.getFullYear();
  const targetMonth = String(targetDate.getMonth() + 1).padStart(2, "0");
  const targetDay = String(targetDate.getDate()).padStart(2, "0");
  const dateStr = `${targetYear}-${targetMonth}-${targetDay}`;

  // Find all tasks matching this day strictly
  const dayTasks = tasks.filter((t) => {
    if (t.dueDate && isSameDay(t.dueDate, targetDate)) return true;
    if (t.startDate && isSameDay(t.startDate, targetDate)) return true;
    if (t.timeLogs && t.timeLogs.some((l) => isSameDay(l.startTime, targetDate))) return true;
    if (!t.dueDate && !t.startDate && t.createdAt && isSameDay(t.createdAt, targetDate)) return true;
    return false;
  });

  const totalTasks = dayTasks.length;
  const completedTasks = dayTasks.filter(
    (t) => t.employeeStatus === "COMPLETED" || t.adminStatus === "FINAL_COMPLETED"
  ).length;
  const inProgressTasks = dayTasks.filter((t) => t.employeeStatus === "IN_PROGRESS").length;
  const onHoldTasks = dayTasks.filter((t) => t.employeeStatus === "ON_HOLD").length;
  const todoTasks = dayTasks.filter((t) => t.employeeStatus === "TODO").length;

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate total seconds logged on that day
  let totalSecondsLogged = 0;
  for (const t of dayTasks) {
    if (t.timeLogs && t.timeLogs.length > 0) {
      for (const log of t.timeLogs) {
        if (isSameDay(log.startTime, targetDate)) {
          totalSecondsLogged += log.durationSeconds || 0;
        }
      }
    } else if (
      (t.dueDate && isSameDay(t.dueDate, targetDate)) ||
      (t.startDate && isSameDay(t.startDate, targetDate))
    ) {
      totalSecondsLogged += t.totalDurationSeconds || 0;
    }
  }

  // Also include running timer seconds if active today
  const isTargetToday = isSameDay(targetDate, new Date());
  if (isTargetToday) {
    for (const t of tasks) {
      if (t.isTimerRunning && t.currentTimerStartedAt) {
        const start = new Date(t.currentTimerStartedAt).getTime();
        const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
        totalSecondsLogged += diff;
      }
    }
  }

  const totalHoursLogged = Number((totalSecondsLogged / 3600).toFixed(1));

  return {
    date: dateStr,
    totalTasks,
    completedTasks,
    inProgressTasks,
    onHoldTasks,
    todoTasks,
    completionRate,
    totalHoursLogged,
    totalSecondsLogged,
  };
}
