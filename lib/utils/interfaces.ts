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
  id?: string;
  name: string;
  due_date: string;
  aura: number;
  completed: boolean;
}

export interface Habit {
  id?: string;
  name: string;
  aura: number;
  next_due_date: string;
  start_date: string;
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
  id?: string;
  name: string;
  aura: number;
  next_due_date: string;
  start_date: string;
  occurence: "weeks" | "months" | "days";
  x_occurence: number;
  repeat: number;
  checklist: string;
}
