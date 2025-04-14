import { useMemo } from "react";
import useRoutineStore from "@/store/routineStore";
import useDashboardStore from "@/store/dashboardStore";
import { Routine } from "@/lib/utils/interfaces";
import {
  calculateNextDueDate,
  formatDateToDDMMYY,
  getDaysRemaining,
  markChecklistIncomplete,
} from "@/lib/utils/commonUtils";

export function useRoutines() {
  const {
    entities: routines,
    isLoading,
    error,
    setError,
    updateEntity: updateRoutine,
    deleteEntity: deleteRoutine,
  } = useRoutineStore();

  const { modifyAura } = useDashboardStore();

  const sortedRoutines = useMemo(() => {
    return [...routines].sort((a: Routine, b: Routine) => {
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
  }, [routines]);

  const handleToggleRoutine = async (
    routineId: string | undefined,
    completed: boolean
  ) => {
    const routine = routines.find((r) => r.id === routineId);
    if (!routineId || !routine) {
      setError("Routine ID is undefined, cannot toggle.");
      console.error("Routine not found for toggle:", routineId);
      return;
    }

    let updatePayload: Partial<Routine>;
    if (!completed) {
      updatePayload = { last_completed: routine.start_date };
    } else {
      updatePayload = {
        last_completed: calculateNextDueDate(
          routine.start_date,
          routine.occurence,
          routine.x_occurence
        ),
      };
    }

    const updatedRoutine = await updateRoutine(routineId, updatePayload);

    if (updatedRoutine) {
      if (!completed) {
        modifyAura(-routine.aura);
      } else {
        modifyAura(routine.aura);
      }
    }
  };

  const handleDeleteRoutine = async (routineId: string | undefined) => {
    if (!routineId) {
      setError("Cannot delete routine: Missing ID.");
      console.error("Cannot delete routine without ID");
      return;
    }
    await deleteRoutine(routineId);
  };

  const handleRefreshRoutine = async (routine: Routine | undefined) => {
    if (!routine || !routine.id) {
      setError("Cannot refresh routine: Missing data.");
      console.error("Cannot refresh routine without ID or routine data");
      return;
    }
    const updatedChecklist = routine.checklist
      ? markChecklistIncomplete(routine.checklist)
      : [];
    const todayStr = formatDateToDDMMYY(new Date());
    await updateRoutine(routine.id, {
      start_date: todayStr,
      last_completed: todayStr,
      checklist: updatedChecklist,
    });
  };

  return {
    routines: sortedRoutines,
    isLoading,
    error,
    setError,
    handleToggleRoutine,
    handleDeleteRoutine,
    handleRefreshRoutine,
  };
}
