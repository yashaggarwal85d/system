export interface Character {
  char: string;
  x: number;
  y: number;
  speed: number;
}

export interface Player {
  username?: string;
  level: number;
  aura: number;
  description: string;
  obsidian_notes?: string;
  mentor: string;
  current_problems: string;
  ideal_future: string;
  biggest_fears: string;
  past_issues?: string;
}

export interface Task {
  id?: string;
  name: string;
  description?: string;
  due_date: string;
  aura: number;
  completed: boolean;
}

export interface SimpleChecklistItem {
  name: string;
  completed: boolean;
}

export interface ChecklistItemData {
  id: string;
  text: string;
  completed: boolean;
  level: number;
  children: ChecklistItemData[];
}

export interface Habit {
  id?: string;
  name: string;
  description?: string;
  aura: number;
  start_date: string;
  occurence: "weeks" | "months" | "days";
  x_occurence: number;
  last_completed: string;
}

export interface HabitConfig {
  period: "days" | "weeks" | "months";
  value: number;
  isGoodHabit: boolean;
}

export interface PlayerFullInfo {
  player: Player;
  habits: Habit[];
  tasks: Task[];
  routines: Routine[];
}

export interface Routine {
  id?: string;
  name: string;
  description?: string;
  aura: number;
  start_date: string;
  occurence: "weeks" | "months" | "days";
  x_occurence: number;
  last_completed: string;
  checklist: ChecklistItemData[];
}

export interface ChatHistoryEntry {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  mentor?: string;
}

export interface VaultData {
  fileName: string;
  content: string;
}

export interface CategorizedTransaction {
  id?: string;
  Timestamp: string;
  Amount: number;
  CrDr: "CR" | "DR";
  Category: string;
  Description?: string;
}
