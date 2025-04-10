"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { PlusCircle } from "lucide-react";
import { Input } from "@/components/common/input";
import { Button } from "@/components/common/button";
import { TaskItem } from "@/components/task/task-item";
import TaskForm from "./TaskForm";
import useTaskStore from "@/store/taskStore";
import useDashboardStore from "@/store/dashboardStore";
import { Task } from "@/lib/utils/interfaces";
import { getDeadlineColor, getDeadlineText } from "@/lib/utils/commonUtils";
import { containerVariants } from "@/lib/utils/animationUtils";

const TasksContainer = () => {
  const { tasks, isLoading, error, setError, addTask, updateTask, deleteTask } =
    useTaskStore();
  const { modifyAura } = useDashboardStore();

  const inputRef = useRef<HTMLInputElement>(null);

  const [newTaskText, setNewTaskText] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const currentYearShort = parseInt(currentYear.toString().slice(-2));
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYearShort);
  const [deadlineError, setDeadlineError] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {}, [tasks]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskText(task.name);
    const deadlineDate = new Date(task.due_date);
    setSelectedDay(deadlineDate.getDate());
    setSelectedMonth(deadlineDate.getMonth() + 1);
    setSelectedYear(parseInt(deadlineDate.getFullYear().toString().slice(-2)));
    setDeadlineError("");
    setShowTaskForm(true);
  };

  const validateDate = (day: number, month: number, yearShort: number) => {
    const yearFull = 2000 + yearShort;
    const daysInMonth = new Date(yearFull, month, 0).getDate();

    if (day < 1 || day > daysInMonth) {
      setDeadlineError(`Invalid day for the selected month (1-${daysInMonth})`);
      return false;
    }

    const selectedDate = new Date(yearFull, month - 1, day);
    selectedDate.setHours(0, 0, 0, 0);

    const checkToday = new Date();
    checkToday.setHours(0, 0, 0, 0);

    const oneYearFromToday = new Date(checkToday);
    oneYearFromToday.setFullYear(checkToday.getFullYear() + 1);

    if (selectedDate < checkToday) {
      setDeadlineError("Deadline cannot be in the past");
      return false;
    }
    if (selectedDate >= oneYearFromToday) {
      setDeadlineError("The deadline must be within one year from today");
      return false;
    }

    setDeadlineError("");
    return true;
  };

  const handleSaveTask = () => {
    if (!newTaskText.trim()) {
      setDeadlineError("Please enter a task name");
      return;
    }
    if (validateDate(selectedDay, selectedMonth, selectedYear)) {
      const dayStr = selectedDay.toString().padStart(2, "0");
      const monthStr = selectedMonth.toString().padStart(2, "0");
      const yearStr = selectedYear.toString().padStart(2, "0");
      const formattedDateString = `${dayStr}-${monthStr}-${yearStr}`;

      console.log("Editing Task:", editingTask);
      if (editingTask && editingTask.id) {
        const updatedTaskDetails = {
          ...editingTask,
          name: newTaskText,
          due_date: formattedDateString,
        };
        console.log("Updated Task Details:", updatedTaskDetails);
        updateTask(editingTask.id, updatedTaskDetails);
      } else {
        addTask(newTaskText, formattedDateString);
      }

      setDeadlineError("");
      setShowTaskForm(false);
      setNewTaskText("");
      setEditingTask(null);
      inputRef.current?.focus();
    }
  };

  const handleToggleTask = async (taskId: string | undefined) => {
    if (!taskId) {
      console.error("Task ID is undefined, cannot toggle.");
      setError("Failed to toggle task: Missing ID.");
      return;
    }

    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      console.error("Task not found:", taskId);
      setError("Failed to toggle task: Task not found.");
      return;
    }

    const newCompletedState = !task.completed;
    try {
      await updateTask(taskId, { completed: newCompletedState });
      if (newCompletedState) {
        modifyAura(task.aura);
      } else {
        modifyAura(-task.aura);
      }
    } catch (updateError) {
      console.error("Failed to update task state:", updateError);
      setError(
        `Failed to update task: ${
          updateError instanceof Error ? updateError.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteTask = (taskId: string | undefined) => {
    if (taskId) {
      deleteTask(taskId);
    } else {
      setError("Failed to delete task. Please try again.");
      console.error(error);
    }
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const a_date = new Date(a.due_date);
      const b_date = new Date(b.due_date);
      return a_date.getTime() - b_date.getTime();
    });
  }, [tasks]);

  if (isLoading && !sortedTasks.length) {
    return (
      <p className="text-center text-muted-foreground">Loading tasks...</p>
    );
  }
  if (error) {
    return <p className="text-center text-destructive">{error}</p>;
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
              console.log("Enter key pressed");
              setEditingTask(null);
              handleSaveTask();
            }
          }}
          className="bg-secondary/60 border-primary/20 focus:border-primary/50 placeholder:text-primary/30" 
        />
        <Button
          onClick={() => {
            setEditingTask(null);
            setDeadlineError("");
            setShowTaskForm(true);
          }}
          className="gap-2 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50 whitespace-nowrap" 
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
            key={task.id}
            {...task}
            onToggle={() => handleToggleTask(task.id)}
            onDelete={() => handleDeleteTask(task.id)}
            onEdit={() => handleEditTask(task)}
            getDeadlineColor={() => getDeadlineColor(task.due_date)}
            getDeadlineText={() => getDeadlineText(task.due_date)}
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
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            deadlineError={deadlineError}
            setDeadlineError={setDeadlineError}
            handleSaveTask={handleSaveTask}
            setShowTaskForm={setShowTaskForm}
            setEditingTask={setEditingTask}
            editingTask={editingTask}
            currentYear={currentYear}
          />
        </motion.div>
      )}
    </div>
  );
};

export default TasksContainer;
