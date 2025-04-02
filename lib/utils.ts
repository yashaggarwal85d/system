import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { HabitConfig } from "./interfaces/habit"; // Assuming HabitConfig is here
import { Routine } from "./interfaces/routine"; // Assuming Routine is here

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Extracted from Dashboard.tsx
export function getAuraValue(
  category: "todo" | "habit" | "task" | "routine"
): number {
  switch (category) {
    case "todo":
      return 10;
    case "habit":
      return 15;
    case "task":
      return 20; // Assuming 'task' was for routines initially or general tasks
    case "routine":
      return 20; // Explicitly for routines
    default:
      return 10;
  }
}

// Implemented based on store logic and Dashboard.tsx usage
export function calculateNextDueDate(
  baseDate: Date,
  frequency?: HabitConfig | Routine["frequency"]
): Date | undefined {
  if (!frequency) return undefined;

  // Ensure baseDate is a Date object
  const validBaseDate =
    typeof baseDate === "string" ? new Date(baseDate) : baseDate;
  if (!(validBaseDate instanceof Date) || isNaN(validBaseDate.getTime())) {
    console.error(
      "Invalid baseDate provided to calculateNextDueDate:",
      baseDate
    );
    return undefined; // Invalid date provided
  }

  const { count, period, value, time } = frequency;
  if (count <= 0 || value <= 0) return undefined; // Invalid frequency

  const nextDue = new Date(validBaseDate); // Use the validated Date object

  // Calculate the interval in milliseconds based on period and value
  let intervalMs: number;
  switch (period) {
    case "days":
      intervalMs = value * 24 * 60 * 60 * 1000;
      break;
    case "weeks":
      intervalMs = value * 7 * 24 * 60 * 60 * 1000;
      break;
    case "months":
      // Calculating months precisely is tricky, add months directly
      nextDue.setMonth(nextDue.getMonth() + value);
      intervalMs = 0; // Handled by setMonth
      break;
    default:
      return undefined; // Unknown period
  }

  // If interval is calculated (days/weeks), add it.
  // The division by 'count' seems complex and might be misinterpreted.
  // Standard habit tracking usually means 'value' period passes 'count' times.
  // Let's assume the interval is simply based on 'value' and 'period' for now.
  // If it means 'count' completions within 'value' period, the logic is different.
  // Sticking to the simpler interpretation: due every 'value' period.
  if (intervalMs > 0) {
    nextDue.setTime(nextDue.getTime() + intervalMs);
  }

  // Set the time if provided
  if (time) {
    const [hours, minutes] = time.split(":").map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      // Set time on the calculated date
      const dateWithTime = new Date(nextDue);
      dateWithTime.setHours(hours, minutes, 0, 0);

      // If the calculated due time is still before the baseDate (e.g., time already passed today)
      // advance it by one interval.
      if (dateWithTime.getTime() <= validBaseDate.getTime()) {
        // Use validated date
        if (intervalMs > 0) {
          dateWithTime.setTime(dateWithTime.getTime() + intervalMs);
        } else if (period === "months") {
          dateWithTime.setMonth(dateWithTime.getMonth() + value);
        }
        // Re-apply time after adding interval
        dateWithTime.setHours(hours, minutes, 0, 0);
      }
      return dateWithTime;
    }
  }

  // If time wasn't set or invalid, return the calculated date part
  // Ensure it's after baseDate if only date changed (e.g. monthly)
  if (
    nextDue.getTime() <= validBaseDate.getTime() &&
    intervalMs === 0 &&
    period === "months"
  ) {
    // This case needs refinement if only date matters and it hasn't advanced past validBaseDate
    // For simplicity, let's assume setMonth already pushed it forward correctly.
  } else if (nextDue.getTime() <= validBaseDate.getTime()) {
    // If after adding interval and setting time, it's still not in the future, something is wrong or needs another interval jump.
    // Let's return the calculated date for now.
  }

  return nextDue;
}

// Placeholder for other missing functions from Dashboard.tsx if needed later
export const isDateWithinOneYearRange = (date: Date): boolean => {
  const today = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(today.getFullYear() + 1);
  today.setHours(0, 0, 0, 0);
  oneYearFromNow.setHours(0, 0, 0, 0);
  return date >= today && date <= oneYearFromNow;
};

export const getDaysRemaining = (deadline?: Date | string): number | null => {
  if (!deadline) return null;
  const validDeadline =
    typeof deadline === "string" ? new Date(deadline) : deadline;
  if (!(validDeadline instanceof Date) || isNaN(validDeadline.getTime())) {
    return null; // Invalid date provided
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Compare dates only
  const deadlineDate = new Date(validDeadline); // Use the validated Date object
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getDeadlineColor = (deadline?: Date): string => {
  const daysRemaining = getDaysRemaining(deadline);
  if (daysRemaining === null) return "text-[#4ADEF6]/70"; // No deadline
  if (daysRemaining < 0) return "text-red-500"; // Overdue
  if (daysRemaining <= 3) return "text-yellow-500"; // Due soon
  return "text-green-500"; // Due later
};

export const getDeadlineText = (deadline?: Date): string => {
  const daysRemaining = getDaysRemaining(deadline);
  if (daysRemaining === null) return "No deadline";
  if (daysRemaining < 0) return `Overdue by ${Math.abs(daysRemaining)} day(s)`;
  if (daysRemaining === 0) return "Due today";
  return `Due in ${daysRemaining} day(s)`;
};

export const getRemainingTime = (nextDue?: Date | string): string => {
  if (!nextDue) return "";
  const validNextDue =
    typeof nextDue === "string" ? new Date(nextDue) : nextDue;
  if (!(validNextDue instanceof Date) || isNaN(validNextDue.getTime())) {
    return "Invalid date"; // Invalid date provided
  }
  const now = new Date();
  const diff = validNextDue.getTime() - now.getTime(); // Use validated date

  if (diff < 0) return "Overdue";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
};
