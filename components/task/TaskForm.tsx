import React from "react";
import { Card, CardContent } from "@/components/common/card";
import { Input } from "@/components/common/input";
import { Button } from "@/components/common/button";
import { Task } from "@/lib/utils/interfaces";
import { NumberWheelPicker } from "@/components/common/number-wheel-picker";

interface TodoFormProps {
  newTaskText: string;
  setNewTaskText: (value: string) => void;
  selectedDay: number;
  setSelectedDay: (value: number) => void;
  selectedMonth: number;
  setSelectedMonth: (value: number) => void;
  selectedYear: number;
  setSelectedYear: (value: number) => void;
  deadlineError: string;
  setDeadlineError: (value: string) => void;
  handleSaveTask: () => void;
  setShowTaskForm: (value: boolean) => void;
  setEditingTask: (task: Task | null) => void;
  editingTask: Task | null;
  currentYear: number;
}

const TodoForm: React.FC<TodoFormProps> = ({
  newTaskText,
  setNewTaskText,
  selectedDay,
  setSelectedDay,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  deadlineError,
  setDeadlineError,
  handleSaveTask,
  setShowTaskForm,
  setEditingTask,
  editingTask,
  currentYear,
}) => {
  const handlePickerChange =
    (setter: (value: number) => void) => (value: number) => {
      setDeadlineError("");
      setter(value);
    };

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
          {/* Replace Input with NumberWheelPickers */}
          <div className="flex flex-col gap-2">
            <span className="text-[#4ADEF6]">Deadline:</span>
            <div className="flex justify-center items-end gap-4 p-2 rounded border border-[#4ADEF6]/20 bg-[#0A1A2F]/60">
              <NumberWheelPicker
                value={selectedDay}
                onChange={handlePickerChange(setSelectedDay)}
                min={1}
                max={31}
                label="Day"
              />
              <NumberWheelPicker
                value={selectedMonth}
                onChange={handlePickerChange(setSelectedMonth)}
                min={1}
                max={12}
                label="Month"
              />
              <NumberWheelPicker
                value={selectedYear}
                onChange={handlePickerChange(setSelectedYear)}
                min={currentYear}
                max={currentYear + 1}
                label="Year"
              />
            </div>
            {deadlineError && (
              <span className="text-red-500 text-sm mt-1">{deadlineError}</span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            onClick={() => {
              setShowTaskForm(false);
              setNewTaskText("");
              setDeadlineError("");
              setEditingTask(null);
            }}
            className="bg-[#4ADEF6]/20 text-[#4ADEF6] hover:bg-[#4ADEF6]/30 border border-[#4ADEF6]/50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveTask}
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
