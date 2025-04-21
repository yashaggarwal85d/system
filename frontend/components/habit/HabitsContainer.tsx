"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { PlusCircle } from "lucide-react";
import { Input } from "@/components/common/input";
import { Button } from "@/components/common/button";
import useHabitStore from "@/store/habitStore";
import useDashboardStore from "@/store/dashboardStore";
import { Habit } from "@/lib/utils/interfaces";
import { formatDateToDDMMYY, getAuraValue } from "@/lib/utils/commonUtils";
import { containerVariants } from "@/lib/utils/animationUtils";
import { HabitItem } from "./habit-item";
import { useHabits } from "@/lib/hooks/useHabits";

const DynamicHabitForm = dynamic(() => import("./HabitForm"), {
  ssr: false,
});

const HabitsContainer = () => {
  const {
    habits: sortedHabits,
    isLoading,
    error,
    setError,
    handleToggleHabit,
    handleDeleteHabit,
    handleRefreshHabit,
  } = useHabits();

  const { addEntity: addHabit, updateEntity: updateHabit } = useHabitStore();
  const { player } = useDashboardStore();

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

  useEffect(() => {}, [error]);

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

    if (editingHabit && editingHabit.id) {
      const updatedHabitDetails = {
        name: habitText,
        occurence: habitConfig.period,
        x_occurence: habitConfig.value,
        aura: Math.abs(editingHabit.aura) * (habitConfig.isGoodHabit ? 1 : -1),
      };
      updateHabit(editingHabit.id, updatedHabitDetails);
    } else {
      if (player?.username) {
        const auraSign = habitConfig.isGoodHabit ? 1 : -1;
        const habitData = {
          userId: player.username,
          name: habitText,
          occurence: habitConfig.period,
          x_occurence: habitConfig.value,
          aura: getAuraValue("habit") * auraSign,
          start_date: formatDateToDDMMYY(new Date()),
          last_completed: formatDateToDDMMYY(new Date()),
        };
        addHabit(habitData);
      } else {
        setError("Cannot add habit: User not found.");
        console.error("User not found in dashboard store when adding habit.");
        return;
      }
    }

    setShowHabitForm(false);
    setEditingHabit(null);
    setHabitText("");
    setFormError(null);
    inputRef.current?.focus();
  };

  if (isLoading && !sortedHabits.length) {
    return (
      <p className="text-center text-muted-foreground">Loading habits...</p>
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
          placeholder="New habit name..."
          value={habitText}
          onChange={(e) => setHabitText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && habitText.trim()) {
              setEditingHabit(null);
              handleSaveHabit();
            }
          }}
          className="bg-secondary border-primary/20 focus:border-primary/50 placeholder:text-primary/30"
        />
        <Button
          onClick={() => {
            setEditingHabit(null);
            setHabitConfig({ period: "days", value: 1, isGoodHabit: true });
            setFormError(null);
            setShowHabitForm(true);
          }}
          className="gap-2 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50 whitespace-nowrap"
        >
          <PlusCircle className="h-4 w-4" /> Add Habit
        </Button>
      </div>

      {/* Habit List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
        layout
      >
        {sortedHabits
          .filter((habit): habit is Habit & { id: string } => !!habit.id)
          .map((habit) => (
            <HabitItem
              key={habit.id}
              {...habit}
              refreshHabit={() => handleRefreshHabit(habit)}
              onToggle={(completed) => handleToggleHabit(habit.id, completed)}
              onDelete={() => handleDeleteHabit(habit.id)}
              onEdit={() => handleEditHabit(habit)}
            />
          ))}
      </motion.div>

      {/* Habit Form Modal */}
      {showHabitForm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm"
        >
          <DynamicHabitForm
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
