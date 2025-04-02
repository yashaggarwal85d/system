import { ChecklistItemData } from "@/components/ui/checklist-item";

export type Frequency = {
  count: number;
  period: "days" | "weeks" | "months";
  value: number;
  time: string;
};

export interface RoutineFormProps {
  initialName?: string;
  onNameChange: (name: string) => void;
  onSave: (routine: Routine) => void;
  onClose: () => void;
  initialRoutine?: Routine;
}

export interface Routine {
  id: string;
  name: string;
  frequency: Frequency;
  checklist: ChecklistItemData[];
  createdAt: Date;
  updatedAt: Date; // Added from Prisma model
  nextDue?: Date;
  completed: boolean;
  lastCompleted?: Date;
  // Removed auraValue
  userId: string; // Added from Prisma model
}
