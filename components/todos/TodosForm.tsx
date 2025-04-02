import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TodoFormProps } from "@/lib/interfaces/task";

const TodoForm: React.FC<TodoFormProps> = ({
  newTaskText,
  setNewTaskText,
  deadlineText,
  setDeadlineText,
  deadlineError,
  setDeadlineError,
  handleDeadlineChange,
  handleSaveTodo,
  setShowTodoForm,
  setEditingTodo,
  editingTodo,
  formattedToday, // Accept the new prop
}) => {
  return (
    <Card className="w-full max-w-md bg-[#0A1A2F]/95 border-[#4ADEF6]/20">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-[#4ADEF6] mb-4">
          {editingTodo ? "Edit Todo" : "Add Todo"}
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
              setShowTodoForm(false);
              setNewTaskText("");
              setDeadlineText(formattedToday ?? "");
              setDeadlineError("");
              setEditingTodo(null);
            }}
            className="bg-[#4ADEF6]/20 text-[#4ADEF6] hover:bg-[#4ADEF6]/30 border border-[#4ADEF6]/50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveTodo}
            className="bg-[#4ADEF6]/20 text-[#4ADEF6] hover:bg-[#4ADEF6]/30 border border-[#4ADEF6]/50"
          >
            {editingTodo ? "Save Changes" : "Add Todo"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodoForm;
