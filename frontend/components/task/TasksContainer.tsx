"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { PlusCircle } from "lucide-react";
import { Input } from "@/components/common/input";
import { Button } from "@/components/common/button";
import { TaskItem } from "@/components/task/task-item";
import useTaskStore from "@/store/taskStore";
import useDashboardStore from "@/store/dashboardStore";
import { Task } from "@/lib/utils/interfaces";
import {
  getDeadlineColorForTask,
  parseDate,
  getAuraValue,
  getDeadlineTextForTask,
} from "@/lib/utils/commonUtils";
import { containerVariants } from "@/lib/utils/animationUtils";
import { useTasks } from "@/lib/hooks/useTasks";

const DynamicTaskForm = dynamic(() => import("./TaskForm"), {
  ssr: false,
});

const TasksContainer = () => {
  const {
    tasks: sortedTasks,
    isLoading,
    error,
    setError,
    handleToggleTask,
    handleDeleteTask,
  } = useTasks();

  const { addEntity: addTask, updateEntity: updateTask } = useTaskStore();
  const { player } = useDashboardStore();

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

  useEffect(() => {}, [error]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskText(task.name);
    const deadlineDate = parseDate(task.due_date);
    if (!isNaN(deadlineDate.getTime())) {
      setSelectedDay(deadlineDate.getDate());
      setSelectedMonth(deadlineDate.getMonth() + 1);
      const yearShort = parseInt(
        deadlineDate.getFullYear().toString().slice(-2)
      );
      setSelectedYear(yearShort);
      setDeadlineError("");
    } else {
      console.error("Failed to parse due_date:", task.due_date);
      setDeadlineError("Could not read the task's deadline date.");
      const today = new Date();
      setSelectedDay(today.getDate());
      setSelectedMonth(today.getMonth() + 1);
      setSelectedYear(parseInt(today.getFullYear().toString().slice(-2)));
    }
    setShowTaskForm(true);
  };

  const validateDate = (day: number, month: number, yearShort: number) => {
    const yearFull = 2000 + yearShort;
    const daysInMonth = new Date(yearFull, month, 0).getDate();
    if (day < 1 || day > daysInMonth) {
      setDeadlineError(`Invalid day for month (1-${daysInMonth})`);
      return false;
    }
    const selectedDate = new Date(yearFull, month - 1, day);
    selectedDate.setHours(0, 0, 0, 0);
    const checkToday = new Date();
    checkToday.setHours(0, 0, 0, 0);
    const oneYearFromToday = new Date(checkToday);
    oneYearFromToday.setFullYear(checkToday.getFullYear() + 1);
    if (selectedDate < checkToday) {
      setDeadlineError("Deadline cannot be past");
      return false;
    }
    if (selectedDate >= oneYearFromToday) {
      setDeadlineError("Deadline > 1 year");
      return false;
    }
    setDeadlineError("");
    return true;
  };

  const handleSaveTask = () => {
    if (!newTaskText.trim()) {
      setDeadlineError("Please enter task name");
      return;
    }
    if (validateDate(selectedDay, selectedMonth, selectedYear)) {
      const dayStr = selectedDay.toString().padStart(2, "0");
      const monthStr = selectedMonth.toString().padStart(2, "0");
      const yearStr = selectedYear.toString().padStart(2, "0");
      const formattedDateString = `${dayStr}-${monthStr}-${yearStr}`;

      if (editingTask && editingTask.id) {
        const updatedTaskDetails = {
          name: newTaskText,
          due_date: formattedDateString,
        };
        updateTask(editingTask.id, updatedTaskDetails);
      } else {
        if (player?.username) {
          const taskData = {
            userId: player.username,
            name: newTaskText,
            due_date: formattedDateString,
            aura: getAuraValue("task"),
            completed: false,
          };
          addTask(taskData);
        } else {
          setError("Cannot add task: User not found.");
          console.error("User not found in dashboard store when adding task.");
          return;
        }
      }

      setDeadlineError("");
      setShowTaskForm(false);
      setNewTaskText("");
      setEditingTask(null);
      inputRef.current?.focus();
    }
  };

  if (isLoading && !sortedTasks.length) {
    return (
      <p className="text-center text-muted-foreground">Loading tasks...</p>
    );
  }
  if (error) {
    return <p className="text-center text-destructive">Error: {error}</p>;
  }

  return (
    <div className="space-y-4">
      {/* Input and Add Button */}
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
          className="bg-secondary border-primary/20 focus:border-primary/50 placeholder:text-primary/30"
        />
        <Button
          onClick={() => {
            setEditingTask(null);

            const today = new Date();
            setSelectedDay(today.getDate());
            setSelectedMonth(today.getMonth() + 1);
            setSelectedYear(parseInt(today.getFullYear().toString().slice(-2)));
            setDeadlineError("");
            setShowTaskForm(true);
          }}
          className="gap-2 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50 whitespace-nowrap"
        >
          <PlusCircle className="h-4 w-4" /> Add Task
        </Button>
      </div>

      {/* Task List */}
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
            getDeadlineColor={() => getDeadlineColorForTask(task.due_date)}
            getDeadlineText={() => getDeadlineTextForTask(task.due_date)}
          />
        ))}
      </motion.div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm"
        >
          <DynamicTaskForm
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
