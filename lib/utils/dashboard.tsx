import { Task } from "../interfaces/task";

const getDaysRemaining = (deadline: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(deadline);
  dueDate.setHours(0, 0, 0, 0);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const getDeadlineColor = (days: number) => {
  if (days < 0) return "text-red-500";
  if (days === 0) return "text-orange-500";
  if (days <= 2) return "text-yellow-500";
  return "text-[#4ADEF6]/70";
};

const getDeadlineText = (deadline: Date) => {
  const days = getDaysRemaining(deadline);
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `${days} days remaining`;
};

const calculateNextDueDate = (
  lastCompleted: Date,
  frequency: Task["frequency"]
) => {
  if (!frequency) return undefined;
  const date = new Date(lastCompleted);

  let periodMs = 0;
  switch (frequency.period) {
    case "days":
      periodMs = 24 * 60 * 60 * 1000 * frequency.value;
      break;
    case "weeks":
      periodMs = 7 * 24 * 60 * 60 * 1000 * frequency.value;
      break;
    case "months":
      periodMs = 30 * 24 * 60 * 60 * 1000 * frequency.value;
      break;
  }

  // Calculate the interval between occurrences
  const intervalMs = periodMs / frequency.count;

  // Add the interval to get the next due date
  date.setTime(date.getTime() + intervalMs);

  // Set the time to the configured time
  const [hours, minutes] = frequency.time.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);

  // If the calculated date is in the past, add one more interval
  if (date.getTime() < new Date().getTime()) {
    date.setTime(date.getTime() + intervalMs);
  }

  return date;
};

const isDateWithinOneYearRange = (date: Date): boolean => {
  const today = new Date();
  const oneYearBefore = new Date(today);
  const oneYearAfter = new Date(today);

  oneYearBefore.setFullYear(today.getFullYear() - 1);
  oneYearAfter.setFullYear(today.getFullYear() + 1);

  return date >= oneYearBefore && date <= oneYearAfter;
};

const getRemainingTime = (nextDue: Date) => {
  const now = new Date();
  const diff = nextDue.getTime() - now.getTime();

  if (diff < 0) return "Overdue";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
};
