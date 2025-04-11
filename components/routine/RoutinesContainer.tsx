"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { PlusCircle } from "lucide-react";
import { Input } from "@/components/common/input";
import { Button } from "@/components/common/button";
import RoutineForm from "./RoutineForm";
import useRoutineStore from "@/store/routineStore";
import useDashboardStore from "@/store/dashboardStore";
import { Routine, ChecklistItemData } from "@/lib/utils/interfaces";
import {
  calculateNextDueDate,
  formatDateToDDMMYY,
} from "@/lib/utils/commonUtils";
import { containerVariants } from "@/lib/utils/animationUtils";
import { RoutineItem } from "./routine-item";

const RoutinesContainer = () => {
  const {
    Routines,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    isLoading,
    setError,
    error,
  } = useRoutineStore();
  const { modifyAura } = useDashboardStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const [routineText, setRoutineText] = useState("");
  const [routineConfig, setRoutineConfig] = useState({
    period: "days" as "days" | "weeks" | "months",
    value: 1,
    isGoodRoutine: true,
  });
  const [showRoutineForm, setShowRoutineForm] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  useEffect(() => {}, [Routines]);

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    setRoutineText(routine.name);
    setRoutineConfig({
      period: routine.occurence,
      value: routine.x_occurence,
      isGoodRoutine: routine.aura >= 0,
    });
    setFormError(null);
    setShowRoutineForm(true);
  };

  const handleSaveRoutine = (checklist: ChecklistItemData[]) => {
    if (!routineText?.trim()) {
      setFormError("Please enter a routine name");
      return;
    }
    console.log(
      "Saving routine:",
      editingRoutine,
      "with checklist:",
      checklist
    );
    if (editingRoutine && editingRoutine.id) {
      updateRoutine(editingRoutine.id, {
        name: routineText,
        occurence: routineConfig.period,
        x_occurence: routineConfig.value,
        aura:
          Math.abs(editingRoutine.aura) *
          (routineConfig.isGoodRoutine ? 1 : -1),
        checklist: checklist,
      });
    } else {
      addRoutine(
        routineText,
        routineConfig.period,
        routineConfig.value,
        routineConfig.isGoodRoutine,
        checklist
      );
    }

    setShowRoutineForm(false);
    setEditingRoutine(null);
    setRoutineText("");
    setFormError(null);
    inputRef.current?.focus();
  };

  const handleToggleRoutine = (
    routineId: string | undefined,
    completed: boolean
  ) => {
    const routine = Routines.find((r) => r.id === routineId);
    if (!routineId || !routine) {
      setError("Routine ID is undefined, cannot toggle.");
      return;
    }
    try {
      console.log(
        routine,
        calculateNextDueDate(
          routine.start_date,
          routine.occurence,
          routine.x_occurence
        )
      );
      if (!completed) {
        updateRoutine(routineId, {
          last_completed: routine.start_date,
        });
        modifyAura(-routine.aura);
      } else {
        updateRoutine(routineId, {
          last_completed: calculateNextDueDate(
            routine.start_date,
            routine.occurence,
            routine.x_occurence
          ),
        });
        modifyAura(routine.aura);
      }
    } catch (updateError) {
      setError("Failed to update routine state");
    }
  };

  const handleDeleteRoutine = (routineId: string | undefined) => {
    if (routineId) {
      deleteRoutine(routineId);
    } else {
      console.error("Cannot delete routine without ID");
    }
  };

  const handleRefreshRoutine = (routine: Routine) => {
    if (routine.id) {
      updateRoutine(routine.id, {
        start_date: formatDateToDDMMYY(new Date()),
        last_completed: formatDateToDDMMYY(new Date()),
      });
    }
  };

  const sortedRoutines = useMemo(() => {
    return [...Routines].sort((a, b) => {
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
  }, [Routines]);

  if (isLoading && !Routines.length) {
    return (
      <p className="text-center text-muted-foreground">Loading routines...</p>
    );
  }
  if (error) {
    return (
      <p className="text-center text-destructive">
        Error loading routines: {error}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          ref={inputRef}
          placeholder="New routine name..."
          value={routineText}
          onChange={(e) => setRoutineText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && routineText.trim()) {
              setEditingRoutine(null);
              handleSaveRoutine([]);
            }
          }}
          className="bg-secondary/60 border-primary/20 focus:border-primary/50 placeholder:text-primary/30"
        />
        <Button
          onClick={() => {
            setEditingRoutine(null);

            setFormError(null);
            setShowRoutineForm(true);
          }}
          className="gap-2 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50 whitespace-nowrap"
        >
          <PlusCircle className="h-4 w-4" /> Add Routine {}
        </Button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
        layout
      >
        {sortedRoutines
          .filter(
            (routine): routine is Routine & { id: string } => !!routine.id
          )
          .map((routine) => {
            return (
              <RoutineItem
                key={routine.id}
                {...routine}
                refreshRoutine={() => handleRefreshRoutine(routine)}
                onToggle={(completed: boolean) =>
                  handleToggleRoutine(routine.id, completed)
                }
                onDelete={() => handleDeleteRoutine(routine.id)}
                onEdit={() => handleEditRoutine(routine)}
              />
            );
          })}
      </motion.div>

      {showRoutineForm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <RoutineForm
            routineText={routineText}
            setRoutineText={setRoutineText}
            routineConfig={routineConfig}
            setRoutineConfig={setRoutineConfig}
            error={formError}
            setError={setFormError}
            handleSaveRoutine={handleSaveRoutine}
            setShowRoutineForm={setShowRoutineForm}
            setEditingRoutine={setEditingRoutine}
            editingRoutine={editingRoutine}
          />
        </motion.div>
      )}
    </div>
  );
};

export default RoutinesContainer;
