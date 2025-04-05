export interface Character {
  char: string;
  x: number;
  y: number;
  speed: number;
}

export interface CharacterSpanProps {
  character: Character;
  index: number;
  isActive: boolean;
}

export interface Player {
  username?: string;
  level: number;
  aura: number;
  description: string;
}

export interface Task {
  id: string | null;
  name: string;
  due_date: Date;
  aura: number;
  completed: boolean;
}

export interface Habit {
  id: string | null;
  name: string;
  aura: number;
  next_due_date: Date;
  start_date: Date;
  occurence: "weeks" | "months" | "days";
  x_occurence: number;
  repeat: number;
}

export interface PlayerFullInfo {
  player: Player;
  habits: Habit[];
  tasks: Task[];
  routines: Routine[];
}

export interface Routine {
  id: string | null;
  name: string;
  aura: number;
  next_due_date: Date;
  start_date: Date;
  occurence: "weeks" | "months" | "days";
  x_occurence: number;
  repeat: number;
  checklist: string;
}
