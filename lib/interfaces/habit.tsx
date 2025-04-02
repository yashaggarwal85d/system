export type HabitConfig = {
  count: number;
  period: "days" | "weeks" | "months";
  value: number;
  isGoodHabit: boolean;
  time: string;
};

export interface HabitFormProps {
  newTaskText: string;
  setNewTaskText: (text: string) => void;
  habitConfig: HabitConfig;
  setHabitConfig: (config: HabitConfig) => void;
  setShowHabitConfig: (show: boolean) => void;
  setEditingHabit: (habit: any) => void;
  handleSaveHabit: () => void;
  editingHabit: any;
}
