import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// TODO - Make this dynamic
export const getAuraValue = <T>(
  category: "habit" | "task" | "routine",
  object: T
): number => {
  switch (category) {
    case "habit":
      return 15;
    case "task":
      return 10;
    case "routine":
      return 20;
    default:
      return 10;
  }
};

export const parseDate = (s: string) => {
  const [d, m, y] = s.split("-").map(Number);
  const t = new Date(2000 + y, m - 1, d);
  return t.getDate() === d &&
    t.getMonth() === m - 1 &&
    t.getFullYear() === 2000 + y
    ? t
    : null;
};

// Calculates the next due date based on a base date and frequency settings.
// For Habit and Routine

export function calculateNextDueDate(
  startDate: Date,
  occurence: "weeks" | "months" | "days",
  x_occurence: number,
  repeat: number
): Date {
  const nextDue = startDate;

  switch (occurence) {
    case "days":
      nextDue.setDate(nextDue.getDate() + x_occurence / repeat);
      break;
    case "weeks":
      nextDue.setDate(nextDue.getDate() + (x_occurence / repeat) * 7);
      break;
    case "months":
      nextDue.setMonth(nextDue.getMonth() + (x_occurence / repeat) * 30);
      break;
    default:
      console.error("Error calculating next due date.");
      break;
  }
  return nextDue;
}

export function calculatePreviousDueDate(
  nextDueDate: Date,
  occurence: "weeks" | "months" | "days",
  x_occurence: number,
  repeat: number
): Date {
  const previousDue = nextDueDate;

  switch (occurence) {
    case "days":
      previousDue.setDate(previousDue.getDate() - x_occurence / repeat);
      break;
    case "weeks":
      previousDue.setDate(previousDue.getDate() - (x_occurence / repeat) * 7);
      break;
    case "months":
      previousDue.setMonth(
        previousDue.getMonth() - (x_occurence / repeat) * 30
      );
      break;
    default:
      console.error("Error calculating previous due date.");
      break;
  }
  return previousDue;
}

// For task deadline
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

export const getDaysRemaining = (deadline: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Compare dates only
  const deadlineDate = new Date(deadline); // Use the validated Date object
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getDeadlineColor = (deadline: Date): string => {
  const daysRemaining = getDaysRemaining(deadline);
  if (daysRemaining === null) return "text-[#4ADEF6]/70"; // No deadline
  if (daysRemaining < 0) return "text-red-500"; // Overdue
  if (daysRemaining <= 3) return "text-yellow-500"; // Due soon
  return "text-green-500"; // Due later
};

export const getDeadlineText = (deadline: Date): string => {
  const daysRemaining = getDaysRemaining(deadline);
  if (daysRemaining === null) return "No deadline";
  if (daysRemaining < 0) return `Overdue by ${Math.abs(daysRemaining)} day(s)`;
  if (daysRemaining === 0) return "Due today";
  return `Due in ${daysRemaining} day(s)`;
};

export const getRemainingTime = (nextDue: Date): string => {
  const now = new Date();
  const diff = nextDue.getTime() - now.getTime(); // Use validated date

  if (diff < 0) return "Overdue";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  if (minutes > 0) return `in ${minutes}m`;
  return "Due now";
};
