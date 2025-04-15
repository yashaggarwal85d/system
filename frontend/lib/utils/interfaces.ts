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
}

export interface Task {
  id?: string;
  name: string;
  description: string | undefined;
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
