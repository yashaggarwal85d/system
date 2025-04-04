"use client";

import { useState, useRef, useEffect, useMemo } from "react"; // Added useMemo, useEffect
import { motion } from "framer-motion";
import { PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TaskItem } from "@/components/ui/task-item";
import TodoForm from "./TodosForm";
import useTodoStore from "@/store/todoStore";
import useDashboardStore from "@/store/dashboardStore";
import { Task } from "@/lib/interfaces/task";
import {
  getDaysRemaining,
  getDeadlineText,
  getRemainingTime,
  isDateWithinOneYearRange,
} from "@/lib/utils";
import { containerVariants } from "@/lib/utils/animations";
import { useSession } from "next-auth/react"; // Import useSession

const TodosContainer = () => {
  const { data: session, status } = useSession(); // Get session status
  const {
    todos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    setLastSelectedDate,
    fetchTodos, // Import fetchTodos
    isLoading,
    error: todoError,
  } = useTodoStore();
  // Use dashboard store only for aura updates, not direct player manipulation
  const { addAura, subtractAura } = useDashboardStore();

  const [newTaskText, setNewTaskText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showTodoForm, setShowTodoForm] = useState(false);

  // Initialize deadlineText with today's date in dd-mm-yy format
  const today = new Date();
  const day = today.getDate().toString().padStart(2, "0");
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const year = today.getFullYear().toString().slice(-2);
  const formattedToday = `${day}-${month}-${year}`;

  const [deadlineText, setDeadlineText] = useState(formattedToday);
  const [deadlineError, setDeadlineError] = useState("");
  const [editingTodo, setEditingTodo] = useState<Task | null>(null);
  const [lastCompletedAura, setLastCompletedAura] = useState<{
    [key: string]: number;
  }>({}); // State to store aura change per task

  // Fetch todos when the component mounts and user is authenticated
  useEffect(() => {
    if (status === "authenticated") {
      fetchTodos();
    }
    // Reset store state if user logs out? Optional.
    // if (status === "unauthenticated") {
    //   setTodos([]); // Clear todos if needed
    // }
  }, [status, fetchTodos]); // Depend on session status and fetch function

  const handleEditTodo = (todo: Task) => {
    setEditingTodo(todo);
    setNewTaskText(todo.title);
    if (todo.deadline) {
      // Ensure deadline is a Date object before calling getDate()
      const deadlineDate =
        typeof todo.deadline === "string"
          ? new Date(todo.deadline)
          : todo.deadline;
      if (deadlineDate instanceof Date && !isNaN(deadlineDate.getTime())) {
        const day = deadlineDate.getDate().toString().padStart(2, "0");
        const month = (deadlineDate.getMonth() + 1).toString().padStart(2, "0");
        const year = deadlineDate.getFullYear().toString().slice(-2);
        setDeadlineText(`${day}-${month}-${year}`);
      } else {
        setDeadlineText(formattedToday); // Fallback if deadline is invalid
      }
    } else {
      setDeadlineText(formattedToday);
    }
    setDeadlineError("");
    setShowTodoForm(true);
  };

  const handleSaveTodo = () => {
    if (!newTaskText.trim()) {
      setDeadlineError("Please enter a name");
      return;
    }

    let deadlineDate: Date | undefined = undefined;
    if (deadlineText && deadlineText !== formattedToday) {
      // Only parse if not default today
      if (
        deadlineText.length !== 8 ||
        !/^\d{2}-\d{2}-\d{2}$/.test(deadlineText)
      ) {
        setDeadlineError("Please enter a valid deadline in dd-mm-yy format");
        return;
      }
      const [day, month, year] = deadlineText.split("-").map(Number);

      if (
        isNaN(day) ||
        isNaN(month) ||
        isNaN(year) ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
      ) {
        setDeadlineError("Invalid date format");
        return;
      }

      deadlineDate = new Date(2000 + year, month - 1, day);
      deadlineDate.setHours(0, 0, 0, 0); // Set time to start of day

      if (isNaN(deadlineDate.getTime())) {
        setDeadlineError("Invalid date value");
        return;
      }

      // Re-check range after confirming validity
      const checkToday = new Date();
      checkToday.setHours(0, 0, 0, 0);
      if (deadlineDate < checkToday) {
        setDeadlineError("Deadline cannot be in the past");
        return;
      }
      if (!isDateWithinOneYearRange(deadlineDate)) {
        setDeadlineError("The deadline must be within one year from today");
        return;
      }
    } else if (deadlineText === formattedToday) {
      // If it's today, set deadlineDate to today
      deadlineDate = new Date();
      deadlineDate.setHours(0, 0, 0, 0);
    }
    // If deadlineText is empty, deadlineDate remains undefined

    if (editingTodo) {
      // Pass undefined or null to clear deadline if deadlineText was cleared
      updateTodo(
        editingTodo.id,
        newTaskText,
        deadlineText ? deadlineDate : null
      );
    } else {
      addTodo(newTaskText, deadlineDate); // Pass undefined if no deadline set
      if (deadlineDate) {
        setLastSelectedDate(deadlineDate); // Update last selected date if one was set
      }
    }

    // Reset form state
    setShowTodoForm(false);
    setNewTaskText("");
    setDeadlineText(formattedToday);
    setDeadlineError("");
    setEditingTodo(null);
    inputRef.current?.focus();
  };

  const handleToggleTodo = async (taskId: string) => {
    const result = await toggleTodo(taskId);
    if (result.error) {
      console.error("Failed to toggle todo:", result.error);
      // TODO: Show error toast to user
      return;
    }
    if (result.auraChange && result.completed) {
      addAura(result.auraChange);
      // Store the positive aura change for display
      setLastCompletedAura((prev) => ({
        ...prev,
        [taskId]: result.auraChange ?? 0,
      }));
    } else if (result.auraChange && !result.completed) {
      subtractAura(Math.abs(result.auraChange));
      // Store the negative aura change for display (though todos shouldn't be negative)
      setLastCompletedAura((prev) => ({
        ...prev,
        [taskId]: result.auraChange ?? 0,
      }));
    } else {
      // Clear aura if uncompleted or no change
      setLastCompletedAura((prev) => {
        const newState = { ...prev };
        delete newState[taskId];
        return newState;
      });
    }
  };

  const handleDeleteTodo = (taskId: string) => {
    deleteTodo(taskId); // Fire-and-forget is okay here
  };

  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeadlineError("");
    const input = e.target.value.replace(/\D/g, ""); // Remove all non-digit characters
    let formattedInput = "";

    if (input.length > 0) {
      formattedInput += input.substring(0, 2);
    }
    if (input.length >= 3) {
      formattedInput += "-" + input.substring(2, 4);
    }
    if (input.length >= 5) {
      formattedInput += "-" + input.substring(4, 6);
    }

    // Limit to dd-mm-yy format (8 characters)
    setDeadlineText(formattedInput.substring(0, 8));
  };

  // Sort todos: by deadline (ascending, undefined last), then by completion status (incomplete first)
  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => {
      // Handle completed status first (false comes before true)
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // Handle deadlines (treat undefined as very far in the future)
      const deadlineA = a.deadline ? a.deadline.getTime() : Infinity;
      const deadlineB = b.deadline ? b.deadline.getTime() : Infinity;

      if (deadlineA !== deadlineB) {
        return deadlineA - deadlineB;
      }

      // Fallback sort by creation date if deadlines are the same/both undefined
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }, [todos]);

  // Render Loading/Error states
  if (isLoading && !sortedTodos.length) {
    // Check sortedTodos length
    // Show loading only on initial load
    return (
      <p className="text-center text-muted-foreground">Loading todos...</p>
    );
  }
  if (todoError) {
    return (
      <p className="text-center text-red-500">
        Error loading todos: {todoError}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          ref={inputRef}
          placeholder="New todo..."
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newTaskText.trim()) {
              setEditingTodo(null);
              setDeadlineText(formattedToday);
              setDeadlineError("");
              setShowTodoForm(true);
            }
          }}
          className="bg-[#0A1A2F]/60 border-[#4ADEF6]/20 focus:border-[#4ADEF6]/50 placeholder:text-[#4ADEF6]/30"
        />
        <Button
          onClick={() => {
            setEditingTodo(null);
            setNewTaskText("");
            setDeadlineText(formattedToday);
            setDeadlineError("");
            setShowTodoForm(true);
          }}
          className="gap-2 bg-[#4ADEF6]/20 text-[#4ADEF6] hover:bg-[#4ADEF6]/30 border border-[#4ADEF6]/50 whitespace-nowrap"
        >
          <PlusCircle className="h-4 w-4" /> Add Todo
        </Button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
        layout
      >
        {sortedTodos.map(
          (
            task // Map over sortedTodos
          ) => (
            <TaskItem
              key={task.id}
              {...task}
              // Ensure dates passed to TaskItem are Date objects or undefined
              createdAt={
                typeof task.createdAt === "string"
                  ? new Date(task.createdAt)
                  : task.createdAt
              }
              updatedAt={
                typeof task.updatedAt === "string"
                  ? new Date(task.updatedAt)
                  : task.updatedAt
              }
              deadline={
                task.deadline &&
                (typeof task.deadline === "string"
                  ? new Date(task.deadline)
                  : task.deadline)
              }
              lastCompleted={
                task.lastCompleted &&
                (typeof task.lastCompleted === "string"
                  ? new Date(task.lastCompleted)
                  : task.lastCompleted)
              }
              nextDue={
                task.nextDue &&
                (typeof task.nextDue === "string"
                  ? new Date(task.nextDue)
                  : task.nextDue)
              }
              onToggle={() => handleToggleTodo(task.id)}
              onUpdate={(id, newTitle) => updateTodo(id, newTitle)} // Simplified update call for TaskItem
              onDelete={() => handleDeleteTodo(task.id)}
              onEdit={() => handleEditTodo(task)}
              lastCompletedAura={lastCompletedAura[task.id]} // Pass down the aura change
              // Provide a default number if getDaysRemaining returns null
              getDaysRemaining={(d: Date | undefined) =>
                getDaysRemaining(d) ?? Infinity
              }
              getDeadlineColor={(days: number | null) => {
                // Keep null check here for color logic
                // Adjusted input type
                if (days === null) return "text-[#4ADEF6]/70";
                if (days < 0) return "text-red-500";
                if (days <= 3) return "text-yellow-500";
                return "text-green-500";
              }}
              getDeadlineText={getDeadlineText}
              getRemainingTime={getRemainingTime}
            />
          )
        )}
      </motion.div>

      {showTodoForm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <TodoForm
            newTaskText={newTaskText}
            setNewTaskText={setNewTaskText}
            deadlineText={deadlineText}
            setDeadlineText={setDeadlineText}
            deadlineError={deadlineError}
            setDeadlineError={setDeadlineError}
            handleDeadlineChange={handleDeadlineChange}
            handleSaveTodo={handleSaveTodo}
            setShowTodoForm={setShowTodoForm}
            setEditingTodo={setEditingTodo}
            editingTodo={editingTodo}
            formattedToday={formattedToday}
          />
        </motion.div>
      )}
    </div>
  );
};

export default TodosContainer;
