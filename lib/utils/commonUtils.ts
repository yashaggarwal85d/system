import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Habit, ChecklistItemData } from "./interfaces";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDateToDDMMYY = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  return `${day}-${month}-${year}`;
};

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
  return t;
};

export function calculateNextDueDate(
  startDate: string,
  occurence: "weeks" | "months" | "days",
  x_occurence: number
): string {
  const nextDue = parseDate(startDate);
  nextDue.setHours(0, 0, 0, 0);
  switch (occurence) {
    case "days":
      nextDue.setDate(nextDue.getDate() + x_occurence);
      break;
    case "weeks":
      nextDue.setDate(nextDue.getDate() + x_occurence * 7);
      break;
    case "months":
      nextDue.setMonth(nextDue.getMonth() + x_occurence * 30);
      break;
    default:
      console.error("Error calculating next due date.");
      break;
  }
  return formatDateToDDMMYY(nextDue);
}

export const isDateWithinOneYearRange = (date: string): boolean => {
  const today = new Date();
  const oneYearFromNow = new Date();
  const deadline = new Date(date);
  oneYearFromNow.setFullYear(today.getFullYear() + 1);
  deadline.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  oneYearFromNow.setHours(0, 0, 0, 0);
  return deadline >= today && deadline <= oneYearFromNow;
};

export const getDaysRemaining = (date: string): number => {
  const deadline = parseDate(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getDeadlineColor = (date: string): string => {
  const daysRemaining = getDaysRemaining(date);
  if (daysRemaining === null) return "text-primary/70"; 
  if (daysRemaining < 0) return "text-destructive"; 
  if (daysRemaining <= 3) return "text-warning"; 
  return "text-success"; 
};

export const getDeadlineText = (deadline: string): string => {
  const daysRemaining = getDaysRemaining(deadline);
  if (daysRemaining === null) return "No deadline";
  if (daysRemaining < 0) return `Overdue by ${Math.abs(daysRemaining)} day(s)`;
  if (daysRemaining === 0) return "Due today";
  return `Due in ${daysRemaining} day(s)`;
};

export const getRefreshColor = (
  start_date: string,
  occurence: "weeks" | "months" | "days",
  x_occurence: number
): string => {
  const daysRemaining = getDaysRemaining(
    calculateNextDueDate(start_date, occurence, x_occurence)
  );
  if (daysRemaining === null) return "text-primary/70"; 
  if (daysRemaining < 0) return "text-destructive"; 
  if (daysRemaining <= 3) return "text-warning"; 
  return "text-success"; 
};

export const getRefreshText = (
  start_date: string,
  occurence: "weeks" | "months" | "days",
  x_occurence: number
): string => {
  const daysRemaining = getDaysRemaining(
    calculateNextDueDate(start_date, occurence, x_occurence)
  );
  if (daysRemaining === null) return "No deadline";
  if (daysRemaining < 0) return ` Overdue by ${Math.abs(daysRemaining)} day(s)`;
  if (daysRemaining === 0) return "es today";
  return `es in ${daysRemaining} day(s)`;
};

export const getRemainingTime = (date: string): string => {
  const now = new Date();
  const nextDue = new Date(date);
  const diff = nextDue.getTime() - now.getTime();

  if (diff < 0) return "Overdue";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  if (minutes > 0) return `in ${minutes}m`;
  return "Due now";
};

export function stringToChecklist(str: string): ChecklistItemData[] {
  return JSON.parse(str) as ChecklistItemData[];
}

export function checklistToString(checklist: ChecklistItemData[]): string {
  return JSON.stringify(checklist);
}
