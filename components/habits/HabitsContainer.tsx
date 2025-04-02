"use client";

import { useState, useRef } from "react";
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

const HabitsContainer = () => {
  const { habits, addHabit, updateHabit, deleteHabit, toggleHabit } =
    useHabitStore();
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
      addHabit({} as any, newTaskText, habitConfig);
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

  const handleToggleHabit = (taskId: string) => {
    const { completed, auraChange } = toggleHabit(taskId);

    if (auraChange > 0) {
      addAura(auraChange);
    } else if (auraChange < 0) {
      subtractAura(Math.abs(auraChange));
    }
  };

  const handleDeleteHabit = (taskId: string) => {
    deleteHabit(taskId);
  };

  const openAddHabitForm = () => {
    setEditingHabit(null);
    // Keep the existing newTaskText

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
        {habits.map((task) => (
          <TaskItem
            key={task.id}
            {...task}
            onToggle={() => handleToggleHabit(task.id)}
            onUpdate={(id, newTitle) => updateHabit(id, newTitle)}
            onDelete={() => handleDeleteHabit(task.id)}
            onEdit={() => handleEditHabit(task)}
            getDaysRemaining={(d: Date | undefined) => getDaysRemaining(d) ?? 0}
            getDeadlineColor={(days: number) => {
              if (days < 0) return "text-red-500";
              if (days <= 1) return "text-yellow-500";
              return "text-green-500";
            }}
            getDeadlineText={(d: Date | undefined) => getDeadlineText(d)}
            getRemainingTime={(d: Date | undefined) => getRemainingTime(d)}
          />
        ))}
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
