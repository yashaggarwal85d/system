"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { PlusCircle } from "lucide-react";
import { Input } from "@/components/common/input";
import { Button } from "@/components/common/button";
import { TaskItem } from "@/components/common/task-item";
import TaskForm from "./TaskForm";
import useTaskStore from "@/store/taskStore";
import useDashboardStore from "@/store/dashboardStore";
import { Task } from "@/lib/utils/interfaces";
import {
  getDaysRemaining,
  getDeadlineColor,
  getDeadlineText,
  getRemainingTime,
  isDateWithinOneYearRange,
  parseDate,
} from "@/lib/utils/commonUtils";
import { containerVariants } from "@/lib/utils/animationUtils";

const TasksContainer = () => {
  const { tasks, isLoading, error, setError, addTask, updateTask, deleteTask } =
    useTaskStore();
  const { modifyAura } = useDashboardStore();

  const inputRef = useRef<HTMLInputElement>(null);

  const [newTaskText, setNewTaskText] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);

  const today = new Date();
  const day = today.getDate().toString().padStart(2, "0");
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const year = today.getFullYear().toString().slice(-2);
  const formattedToday = `${day}-${month}-${year}`;

  const [deadlineText, setDeadlineText] = useState(formattedToday);
  const [deadlineError, setDeadlineError] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {}, [tasks]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskText(task.name);
    const deadlineDate = task.due_date;
    const day = deadlineDate.getDate().toString().padStart(2, "0");
    const month = (deadlineDate.getMonth() + 1).toString().padStart(2, "0");
    const year = deadlineDate.getFullYear().toString().slice(-2);
    setDeadlineText(`${day}-${month}-${year}`);
    setDeadlineError("");
    setShowTaskForm(true);
  };

  const validateDate = (text: string) => {
    const checkToday = new Date();
    checkToday.setHours(0, 0, 0, 0);
    if (
      text.length !== 8 ||
      !/^\d{2}-\d{2}-\d{2}$/.test(text) ||
      !/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(\d{2})$/.test(text) ||
      parseDate(text) === null
    ) {
      setDeadlineError("Please enter a valid deadline in dd-mm-yy format");
      return false;
    } else if (isDateWithinOneYearRange(parseDate(text)!)) {
      setDeadlineError("The deadline must be within one year from today");
      return false;
    } else if (parseDate(text)! < checkToday) {
      setDeadlineError("Deadline cannot be in the past");
    } else {
      return true;
    }
  };

  const handleSaveTask = () => {
    if (!newTaskText.trim()) {
      setDeadlineError("Please enter a name");
      return;
    }
    if (validateDate(deadlineText)) {
      if (editingTask && editingTask.id) {
        updateTask(editingTask.id, editingTask);
      } else {
        addTask(newTaskText, parseDate(deadlineText)!);
      }
      setDeadlineError("");
      setShowTaskForm(false);
      setNewTaskText("");
      setEditingTask(null);
      inputRef.current?.focus();
    }
  };

  const handleToggleTask = async (taskId: string | null) => {
    if (taskId) {
      await updateTask(taskId, { completed: true });
    }
    if (!taskId || error) {
      console.error("Failed to toggle task:", error);
      return;
    } else {
      const task = tasks.filter((task) => task.id === taskId)[0];
      modifyAura(task.aura);
    }
  };

  const handleDeleteTask = (taskId: string | null) => {
    if (taskId) {
      deleteTask(taskId);
    } else {
      setError("Failed to delete task. Please try again.");
      console.error(error);
    }
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

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return a.due_date.getTime() - b.due_date.getTime();
    });
  }, [tasks]);

  // Render Loading/Error states
  if (isLoading && !sortedTasks.length) {
    return (
      <p className="text-center text-muted-foreground">Loading tasks...</p>
    );
  }
  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          ref={inputRef}
          placeholder="New task..."
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newTaskText.trim()) {
              setEditingTask(null);
              handleSaveTask();
            }
          }}
          className="bg-[#0A1A2F]/60 border-[#4ADEF6]/20 focus:border-[#4ADEF6]/50 placeholder:text-[#4ADEF6]/30"
        />
        <Button
          onClick={() => {
            setEditingTask(null);
            setDeadlineError("");
            setShowTaskForm(true);
          }}
          className="gap-2 bg-[#4ADEF6]/20 text-[#4ADEF6] hover:bg-[#4ADEF6]/30 border border-[#4ADEF6]/50 whitespace-nowrap"
        >
          <PlusCircle className="h-4 w-4" /> Add Task
        </Button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
        layout
      >
        {sortedTasks.map((task) => (
          <TaskItem
            {...task}
            onToggle={() => handleToggleTask(task.id)}
            onDelete={() => handleDeleteTask(task.id)}
            onEdit={() => handleEditTask(task)}
            getDaysRemaining={() => getDaysRemaining(task.due_date)}
            getDeadlineColor={() => getDeadlineColor(task.due_date)}
            getDeadlineText={() => getDeadlineText(task.due_date)}
            getRemainingTime={() => getRemainingTime(task.due_date)}
          />
        ))}
      </motion.div>

      {showTaskForm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <TaskForm
            newTaskText={newTaskText}
            setNewTaskText={setNewTaskText}
            deadlineText={deadlineText}
            setDeadlineText={setDeadlineText}
            deadlineError={deadlineError}
            setDeadlineError={setDeadlineError}
            handleDeadlineChange={handleDeadlineChange}
            handleSaveTask={handleSaveTask}
            setShowTaskForm={setShowTaskForm}
            setEditingTask={setEditingTask}
            editingTask={editingTask}
            formattedToday={formattedToday}
          />
        </motion.div>
      )}
    </div>
  );
};

export default TasksContainer;
