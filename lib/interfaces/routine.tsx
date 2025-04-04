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
  // Update onSave to expect the Omitted type
  onSave: (
    routineData: Omit<
      Routine,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "completed"
      | "nextDue"
      | "lastCompleted"
      | "userId"
      | "auraValue" // Also omit auraValue as it's calculated backend/store side
    >
  ) => void;
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
  auraValue?: number; // Added optional auraValue
  userId: string; // Added from Prisma model
}
