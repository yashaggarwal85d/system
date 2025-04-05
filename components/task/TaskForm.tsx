import React from "react"; // Import React
import { Card, CardContent } from "@/components/common/card";
import { Input } from "@/components/common/input";
import { Button } from "@/components/common/button";
import { Task } from "@/lib/utils/interfaces"; // Import Task interface

// Define the props interface
interface TodoFormProps {
  newTaskText: string;
  setNewTaskText: (value: string) => void;
  deadlineText: string;
  setDeadlineText: (value: string) => void;
  deadlineError: string;
  setDeadlineError: (value: string) => void;
  handleDeadlineChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveTask: () => void; // Renamed from handleSaveTodo
  setShowTaskForm: (value: boolean) => void; // Renamed from setShowTodoForm
  setEditingTask: (task: Task | null) => void; // Renamed from setEditingTodo
  editingTask: Task | null; // Renamed from editingTodo
  formattedToday?: string; // Make optional as it's used with ??
}

const TodoForm: React.FC<TodoFormProps> = ({
  newTaskText,
  setNewTaskText,
  deadlineText,
  setDeadlineText,
  deadlineError,
  setDeadlineError,
  handleDeadlineChange,
  handleSaveTask, // Renamed from handleSaveTodo
  setShowTaskForm, // Renamed from setShowTodoForm
  setEditingTask, // Renamed from setEditingTodo
  editingTask, // Renamed from editingTodo
  formattedToday, // Accept the new prop
}) => {
  return (
    <Card className="w-full max-w-md bg-[#0A1A2F]/95 border-[#4ADEF6]/20">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-[#4ADEF6] mb-4">
          {editingTask ? "Edit Todo" : "Add Todo"} {/* Use editingTask */}
        </h3>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-[#4ADEF6]">Name:</span>
            <Input
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="bg-[#0A1A2F]/60 border-[#4ADEF6]/20 focus:border-[#4ADEF6]/50 placeholder:text-[#4ADEF6]/30"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[#4ADEF6]">Deadline (dd-mm-yy):</span>
            <Input
              value={deadlineText}
              onChange={(e) => {
                setDeadlineError("");
                handleDeadlineChange(e);
              }}
              placeholder="dd-mm-yy"
              className="bg-[#0A1A2F]/60 border-[#4ADEF6]/20 focus:border-[#4ADEF6]/50 placeholder:text-[#4ADEF6]/30"
            />
            {deadlineError && (
              <span className="text-red-500 text-sm">{deadlineError}</span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            onClick={() => {
              setShowTaskForm(false); // Renamed from setShowTodoForm
              setNewTaskText("");
              setDeadlineText(formattedToday ?? "");
              setDeadlineError("");
              setEditingTask(null); // Renamed from setEditingTodo
            }}
            className="bg-[#4ADEF6]/20 text-[#4ADEF6] hover:bg-[#4ADEF6]/30 border border-[#4ADEF6]/50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveTask} // Renamed from handleSaveTodo
            className="bg-[#4ADEF6]/20 text-[#4ADEF6] hover:bg-[#4ADEF6]/30 border border-[#4ADEF6]/50"
          >
            {editingTask ? "Save Changes" : "Add Todo"} {/* Use editingTask */}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodoForm;
