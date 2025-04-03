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

// Calculates the next due date based on a base date and frequency settings.
export function calculateNextDueDate(
  baseDate: Date | string, // Accept string or Date
  frequency?: HabitConfig | Routine["frequency"]
): Date | undefined {
  if (!frequency) return undefined;

  // 1. Validate and establish the base date/time for calculation
  const validBaseDate =
    typeof baseDate === "string" ? new Date(baseDate) : new Date(baseDate); // Clone to avoid mutation
  if (!(validBaseDate instanceof Date) || isNaN(validBaseDate.getTime())) {
    console.error(
      "Invalid baseDate provided to calculateNextDueDate:",
      baseDate
    );
    return undefined;
  }

  const { count, period, value, time } = frequency;
  // We currently ignore 'count' and assume the task is due every 'value' periods.
  if (value <= 0) return undefined; // Invalid frequency value

  const nextDue = new Date(validBaseDate); // Start calculation from base date

  // 2. Add the primary interval based on 'value' and 'period'
  switch (period) {
    case "days":
      nextDue.setDate(nextDue.getDate() + value);
      break;
    case "weeks":
      nextDue.setDate(nextDue.getDate() + value * 7);
      break;
    case "months":
      nextDue.setMonth(nextDue.getMonth() + value);
      break;
    default:
      console.error("Unknown period in calculateNextDueDate:", period);
      return undefined;
  }

  // 3. Set the specific time if provided
  let timeWasSet = false;
  if (time) {
    const [hours, minutes] = time.split(":").map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      nextDue.setHours(hours, minutes, 0, 0);
      timeWasSet = true;
    } else {
      console.warn("Invalid time format provided:", time);
      // Fallback to start of day if time is invalid
      nextDue.setHours(0, 0, 0, 0);
    }
  } else {
    // If no time specified, default to the start of the calculated day
    nextDue.setHours(0, 0, 0, 0);
  }

  // 4. Ensure the calculated 'nextDue' is strictly after the 'baseDate'
  // This handles cases where the interval is daily and the time is earlier than the base time,
  // or monthly calculations that land on the same day initially.
  while (nextDue.getTime() <= validBaseDate.getTime()) {
    // Keep adding the interval until it's in the future
    switch (period) {
      case "days":
        nextDue.setDate(nextDue.getDate() + value);
        break;
      case "weeks":
        nextDue.setDate(nextDue.getDate() + value * 7);
        break;
      case "months":
        nextDue.setMonth(nextDue.getMonth() + value);
        break;
    }
    // Re-apply time after adding the interval if it was originally set
    if (timeWasSet) {
      const [hours, minutes] = time.split(":").map(Number);
      nextDue.setHours(hours, minutes, 0, 0);
    } else {
      nextDue.setHours(0, 0, 0, 0); // Ensure start of day otherwise
    }
  }

  return nextDue; // Return the final calculated date
}

// Utility functions previously present
export const isDateWithinOneYearRange = (date: Date): boolean => {
  const today = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(today.getFullYear() + 1);
  today.setHours(0, 0, 0, 0);
  oneYearFromNow.setHours(0, 0, 0, 0);
  // Ensure date is also a Date object before comparison
  if (!(date instanceof Date) || isNaN(date.getTime())) return false;
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate >= today && checkDate <= oneYearFromNow;
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

export const getDeadlineColor = (deadline?: Date | string): string => {
  const daysRemaining = getDaysRemaining(deadline);
  if (daysRemaining === null) return "text-[#4ADEF6]/70"; // No deadline
  if (daysRemaining < 0) return "text-red-500"; // Overdue
  if (daysRemaining <= 3) return "text-yellow-500"; // Due soon
  return "text-green-500"; // Due later
};

export const getDeadlineText = (deadline?: Date | string): string => {
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
  if (minutes > 0) return `in ${minutes}m`; // Show minutes if less than an hour
  return "Due now"; // Or handle very close due times
};

// Function to format the reset time
export const formatResetTime = (nextDueDate?: Date | string): string => {
  if (!nextDueDate) return "";
  const validNextDue =
    typeof nextDueDate === "string" ? new Date(nextDueDate) : nextDueDate;
  if (!(validNextDue instanceof Date) || isNaN(validNextDue.getTime())) {
    return "Invalid date";
  }

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  return `Resets ${validNextDue.toLocaleString("en-US", options)}`;
};
