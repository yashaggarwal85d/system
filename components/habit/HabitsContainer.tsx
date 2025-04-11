"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { PlusCircle } from "lucide-react";
import { Input } from "@/components/common/input";
import { Button } from "@/components/common/button";
import HabitForm from "./HabitForm";
import useHabitStore from "@/store/habitStore";
import useDashboardStore from "@/store/dashboardStore";
import { Habit } from "@/lib/utils/interfaces";
import {
  calculateNextDueDate,
  formatDateToDDMMYY,
} from "@/lib/utils/commonUtils";
import { containerVariants } from "@/lib/utils/animationUtils";
import { HabitItem } from "./habit-item";

const HabitsContainer = () => {
  const {
    Habits,
    addHabit,
    updateHabit,
    deleteHabit,
    isLoading,
    setError,
    error,
  } = useHabitStore();
  const { modifyAura } = useDashboardStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const [habitText, setHabitText] = useState("");
  const [habitConfig, setHabitConfig] = useState({
    period: "days" as "days" | "weeks" | "months",
    value: 1,
    isGoodHabit: true,
  });
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  useEffect(() => {}, [Habits]);

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitText(habit.name);
    setHabitConfig({
      period: habit.occurence,
      value: habit.x_occurence,
      isGoodHabit: habit.aura >= 0,
    });
    setFormError(null);
    setShowHabitForm(true);
  };

  const handleSaveHabit = () => {
    if (!habitText?.trim()) {
      setFormError("Please enter a habit name");
      return;
    }
    console.log(editingHabit);
    if (editingHabit && editingHabit.id) {
      updateHabit(editingHabit.id, {
        occurence: habitConfig.period,
        x_occurence: habitConfig.value,
        aura: Math.abs(editingHabit.aura) * (habitConfig.isGoodHabit ? 1 : -1),
      });
    } else {
      addHabit(
        habitText,
        habitConfig.period,
        habitConfig.value,
        habitConfig.isGoodHabit
      );
    }

    setShowHabitForm(false);
    setEditingHabit(null);
    setHabitText("");
    setFormError(null);
    inputRef.current?.focus();
  };

  const handleToggleHabit = (
    habitId: string | undefined,
    completed: boolean
  ) => {
    const habit = Habits.find((h) => h.id === habitId);
    if (!habitId || !habit) {
      setError("Habit ID is undefined, cannot toggle.");
      return;
    }
    try {
      console.log(
        habit,
        calculateNextDueDate(
          habit.start_date,
          habit.occurence,
          habit.x_occurence
        )
      );
      if (!completed) {
        updateHabit(habitId, {
          last_completed: habit.start_date,
        });
        modifyAura(-habit.aura);
      } else {
        updateHabit(habitId, {
          last_completed: calculateNextDueDate(
            habit.start_date,
            habit.occurence,
            habit.x_occurence
          ),
        });
        modifyAura(habit.aura);
      }
    } catch (updateError) {
      setError("Failed to update habit state");
    }
  };

  const handleDeleteHabit = (habitId: string | undefined) => {
    if (habitId) {
      deleteHabit(habitId);
    } else {
      console.error("Cannot delete habit without ID");
    }
  };

  const handleRefresh = (habit: Habit) => {
    if (habit.id) {
      updateHabit(habit.id, {
        start_date: formatDateToDDMMYY(new Date()),
        last_completed: formatDateToDDMMYY(new Date()),
      });
    }
  };

  const sortedHabits = useMemo(() => {
    return [...Habits].sort((a, b) => {
      if (a.last_completed !== b.last_completed) {
        const startDateA = a.last_completed
          ? new Date(a.last_completed).getTime()
          : Infinity;
        const startDateB = b.last_completed
          ? new Date(b.last_completed).getTime()
          : Infinity;

        const validStartDateA = isNaN(startDateA) ? Infinity : startDateA;
        const validStartDateB = isNaN(startDateB) ? Infinity : startDateB;

        return validStartDateA - validStartDateB;
      } else {
        const startDateA = a.start_date
          ? new Date(a.start_date).getTime()
          : Infinity;
        const startDateB = b.start_date
          ? new Date(b.start_date).getTime()
          : Infinity;

        const validStartDateA = isNaN(startDateA) ? Infinity : startDateA;
        const validStartDateB = isNaN(startDateB) ? Infinity : startDateB;

        return validStartDateA - validStartDateB;
      }
    });
  }, [Habits]);

  if (isLoading && !Habits.length) {
    return (
      <p className="text-center text-muted-foreground">Loading habits...</p>
    );
  }
  if (error) {
    return (
      <p className="text-center text-destructive">
        Error loading habits: {error}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          ref={inputRef}
          placeholder="New habit name..."
          value={habitText}
          onChange={(e) => setHabitText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && habitText.trim()) {
              setEditingHabit(null);
              handleSaveHabit();
            }
          }}
          className="bg-secondary/60 border-primary/20 focus:border-primary/50 placeholder:text-primary/30" 
        />
        <Button
          onClick={() => {
            setEditingHabit(null);
            setHabitText("");
            setFormError(null);
            setShowHabitForm(true);
          }}
          className="gap-2 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50 whitespace-nowrap" 
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
        {sortedHabits
          .filter((habit): habit is Habit & { id: string } => !!habit.id)
          .map((habit) => {
            return (
              <HabitItem
                key={habit.id}
                {...habit}
                refreshHabit={() => handleRefresh(habit)}
                onToggle={(completed) => handleToggleHabit(habit.id, completed)}
                onDelete={() => handleDeleteHabit(habit.id)}
                onEdit={() => handleEditHabit(habit)}
              />
            );
          })}
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
            habitText={habitText}
            setHabitText={setHabitText}
            habitConfig={habitConfig}
            setHabitConfig={setHabitConfig}
            error={formError}
            setError={setFormError}
            handleSaveHabit={handleSaveHabit}
            setShowHabitForm={setShowHabitForm}
            setEditingHabit={setEditingHabit}
            editingHabit={editingHabit}
          />
        </motion.div>
      )}
    </div>
  );
};

export default HabitsContainer;
