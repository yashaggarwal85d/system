export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: "todo" | "habit" | "task"; // Consider if "task" is still needed or just "routine"
  createdAt: Date;
  updatedAt: Date; // Added from Prisma model
  deadline?: Date;
  auraValue?: number; // Added optional auraValue
  isHabit?: boolean;
  frequency?: {
    count: number;
    period: "days" | "weeks" | "months";
    value: number;
    time: string;
  };
  isGoodHabit?: boolean;
  lastCompleted?: Date;
  nextDue?: Date;
  originalTime?: string;
  userId: string; // Added from Prisma model
}

export interface TodoFormProps {
  newTaskText: string;
  setNewTaskText: (text: string) => void;
  deadlineText: string;
  setDeadlineText: (text: string) => void;
  deadlineError: string;
  setDeadlineError: (error: string) => void;
  handleDeadlineChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveTodo: () => void;
  setShowTodoForm: (show: boolean) => void;
  setEditingTodo: (todo: Task | null) => void;
  editingTodo: Task | null;
  formattedToday?: string; // Add optional prop for today's date string
}
