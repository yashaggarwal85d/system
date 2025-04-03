"use client";

import { useState, useRef, useEffect, useMemo } from "react"; // Ensure useEffect and useMemo are imported
import { motion } from "framer-motion";
import { PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TaskItem } from "@/components/ui/task-item";
import HabitForm from "./HabitForm";
import useHabitStore from "@/store/habitStore";
import useDashboardStore from "@/store/dashboardStore";
import { Task } from "@/lib/interfaces/task";
import { HabitConfig } from "@/lib/interfaces/habit";
import {
  getDaysRemaining,
  getDeadlineText,
  getRemainingTime,
} from "@/lib/utils";
import { containerVariants } from "@/lib/utils/animations";
import { useSession } from "next-auth/react"; // Import useSession

const HabitsContainer = () => {
  const { data: session, status } = useSession(); // Get session status
  const {
    habits,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabit,
    fetchHabits, // Get fetch action
    isLoading,
    error: habitError, // Get loading/error state
  } = useHabitStore();
  const { addAura, subtractAura } = useDashboardStore();

  const [newTaskText, setNewTaskText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [habitConfig, setHabitConfig] = useState<HabitConfig>(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return {
      count: 1,
      period: "days",
      value: 1,
      isGoodHabit: true,
      time: `${hours}:${minutes}`,
    };
  });
  const [editingHabit, setEditingHabit] = useState<Task | null>(null);

  // Fetch habits when component mounts and user is authenticated
  useEffect(() => {
    if (status === "authenticated") {
      fetchHabits();
    }
    // Optionally clear habits if status becomes unauthenticated?
  }, [status, fetchHabits]);

  const handleEditHabit = (habit: Task) => {
    setEditingHabit(habit);
    setNewTaskText(habit.title);
    if (habit.frequency) {
      setHabitConfig({
        count: habit.frequency.count,
        period: habit.frequency.period,
        value: habit.frequency.value,
        time: habit.frequency.time,
        isGoodHabit: habit.isGoodHabit || false,
      });
    } else {
      // Reset to default if frequency is missing
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setHabitConfig({
        count: 1,
        period: "days",
        value: 1,
        time: `${hours}:${minutes}`,
        isGoodHabit: true,
      });
    }
    setShowHabitForm(true);
  };

  const handleSaveHabit = () => {
    if (!newTaskText.trim()) {
      alert("Please enter a name");
      return;
    }
    if (!habitConfig.time || habitConfig.count < 1 || habitConfig.value < 1) {
      alert("Please configure all habit settings");
      return;
    }

    if (editingHabit) {
      updateHabit(editingHabit.id, newTaskText, habitConfig);
    } else {
      addHabit(newTaskText, habitConfig); // Corrected call
    }

    setShowHabitForm(false);
    setNewTaskText("");
    const currentTime = habitConfig.time;
    setHabitConfig({
      count: 1,
      period: "days",
      value: 1,
      time: currentTime,
      isGoodHabit: true,
    });
    setEditingHabit(null);
    inputRef.current?.focus();
  };

  // Make the handler async to await the result
  const handleToggleHabit = async (taskId: string) => {
    const result = await toggleHabit(taskId); // Await the promise

    if (result.error) {
      console.error("Failed to toggle habit:", result.error);
      // TODO: Show error toast
      return;
    }

    // Use auraChange from the result
    if (result.auraChange && result.auraChange > 0) {
      addAura(result.auraChange);
    } else if (result.auraChange && result.auraChange < 0) {
      subtractAura(Math.abs(result.auraChange));
    }
  };

  const handleDeleteHabit = (taskId: string) => {
    deleteHabit(taskId); // Fire-and-forget is okay
  };

  const openAddHabitForm = () => {
    setEditingHabit(null);
    // Reset config to default, keeping the time
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    setHabitConfig({
      count: 1,
      period: "days",
      value: 1,
      time: `${hours}:${minutes}`,
      isGoodHabit: true,
    });
    setShowHabitForm(true);
  };

  // Sort habits: by completion status (incomplete first), then by nextDue date (ascending, null/undefined last)
  const sortedHabits = useMemo(() => {
    return [...habits].sort((a, b) => {
      // Handle completed status first (false comes before true)
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // Handle nextDue dates (treat null/undefined as very far in the future)
      const nextDueA = a.nextDue ? new Date(a.nextDue).getTime() : Infinity;
      const nextDueB = b.nextDue ? new Date(b.nextDue).getTime() : Infinity;

      if (nextDueA !== nextDueB) {
        return nextDueA - nextDueB;
      }

      // Fallback sort by creation date if nextDue dates are the same/both undefined
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [habits]);

  // Render Loading/Error states
  if (isLoading && !sortedHabits.length) {
    // Check sortedHabits length
    // Show loading only on initial load
    return (
      <p className="text-center text-muted-foreground">Loading habits...</p>
    );
  }
  if (habitError) {
    return (
      <p className="text-center text-red-500">
        Error loading habits: {habitError}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          ref={inputRef}
          placeholder="New habit..."
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newTaskText.trim()) {
              openAddHabitForm();
            }
          }}
          className="bg-[#0A1A2F]/60 border-[#4ADEF6]/20 focus:border-[#4ADEF6]/50 placeholder:text-[#4ADEF6]/30"
        />
        <Button
          onClick={openAddHabitForm}
          className="gap-2 bg-[#4ADEF6]/20 text-[#4ADEF6] hover:bg-[#4ADEF6]/30 border border-[#4ADEF6]/50 whitespace-nowrap"
        >
          <PlusCircle className="h-4 w-4" /> Add Habit
        </Button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
        layout
      >
        {sortedHabits.map(
          (
            task // Map over sortedHabits
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
              onToggle={() => handleToggleHabit(task.id)}
              onUpdate={(id, newTitle) => updateHabit(id, newTitle)} // Basic update, config needs form
              onDelete={() => handleDeleteHabit(task.id)}
              onEdit={() => handleEditHabit(task)}
              getDaysRemaining={(d: Date | undefined) =>
                getDaysRemaining(d) ?? Infinity
              } // Use Infinity for sorting if no date
              getDeadlineColor={(days: number | null) => {
                // Accept null
                if (days === null) return "text-[#4ADEF6]/70"; // Handle null case
                if (days < 0) return "text-red-500";
                if (days <= 1) return "text-yellow-500";
                return "text-green-500";
              }}
              getDeadlineText={(d: Date | undefined) => getDeadlineText(d)}
              getRemainingTime={(d: Date | undefined) => getRemainingTime(d)}
            />
          )
        )}
      </motion.div>

      {showHabitForm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <HabitForm
            newTaskText={newTaskText}
            setNewTaskText={setNewTaskText}
            habitConfig={habitConfig}
            setHabitConfig={setHabitConfig}
            setShowHabitConfig={setShowHabitForm}
            setEditingHabit={setEditingHabit}
            handleSaveHabit={handleSaveHabit}
            editingHabit={editingHabit}
          />
        </motion.div>
      )}
    </div>
  );
};

export default HabitsContainer;
