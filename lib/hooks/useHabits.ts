import { useMemo } from "react";
import useHabitStore from "@/store/habitStore";
import useDashboardStore from "@/store/dashboardStore";
import { Habit } from "@/lib/utils/interfaces";
import {
  calculateNextDueDate,
  formatDateToDDMMYY,
  getDaysRemaining,
} from "@/lib/utils/commonUtils";

export function useHabits() {
  const {
    entities: habits,
    isLoading,
    error,
    setError,
    updateEntity: updateHabit,
    deleteEntity: deleteHabit,
  } = useHabitStore();

  const { modifyAura } = useDashboardStore();

  const sortedHabits = useMemo(() => {
    return [...habits].sort((a: Habit, b: Habit) => {
      const a_remaining = getDaysRemaining(
        calculateNextDueDate(a.start_date, a.occurence, a.x_occurence)
      );
      const b_remaining = getDaysRemaining(
        calculateNextDueDate(b.start_date, b.occurence, b.x_occurence)
      );

      if (isNaN(a_remaining)) return 1;
      if (isNaN(b_remaining)) return -1;
      return a_remaining - b_remaining;
    });
  }, [habits]);

  const handleToggleHabit = async (
    habitId: string | undefined,
    completed: boolean
  ) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habitId || !habit) {
      setError("Habit ID is undefined, cannot toggle.");
      console.error("Habit not found for toggle:", habitId);
      return;
    }

    let updatePayload: Partial<Habit>;
    if (!completed) {
      updatePayload = { last_completed: habit.start_date };
    } else {
      updatePayload = { last_completed: formatDateToDDMMYY(new Date()) };
    }

    const updatedHabit = await updateHabit(habitId, updatePayload);

    if (updatedHabit) {
      if (!completed) {
        modifyAura(-habit.aura);
      } else {
        modifyAura(habit.aura);
      }
    }
  };

  const handleDeleteHabit = async (habitId: string | undefined) => {
    if (!habitId) {
      setError("Cannot delete habit: Missing ID.");
      console.error("Cannot delete habit without ID");
      return;
    }
    await deleteHabit(habitId);
  };

  const handleRefreshHabit = async (habit: Habit | undefined) => {
    if (!habit || !habit.id) {
      setError("Cannot refresh habit: Missing data.");
      console.error("Cannot refresh habit without ID or habit data");
      return;
    }
    const todayStr = formatDateToDDMMYY(new Date());
    await updateHabit(habit.id, {
      start_date: todayStr,
      last_completed: todayStr,
    });
  };

  return {
    habits: sortedHabits,
    isLoading,
    error,
    setError,
    handleToggleHabit,
    handleDeleteHabit,
    handleRefreshHabit,
  };
}
