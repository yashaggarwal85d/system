"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import { PlusCircle } from "lucide-react";
import { Input } from "@/components/common/input";
import { Button } from "@/components/common/button";

import useRoutineStore from "@/store/routineStore";
import useDashboardStore from "@/store/dashboardStore";
import { Routine, ChecklistItemData } from "@/lib/utils/interfaces";
import {
  formatDateToDDMMYY,
  getAuraValue,
  parseDate,
} from "@/lib/utils/commonUtils";
import { containerVariants } from "@/lib/utils/animationUtils";
import { RoutineItem } from "./routine-item";
import { useRoutines } from "@/lib/hooks/useRoutines";

const DynamicRoutineForm = dynamic(() => import("./RoutineForm"), {
  ssr: false,
});

const RoutinesContainer = () => {
  const {
    routines: sortedRoutines,
    isLoading,
    error,
    setError,
    handleToggleRoutine,
    handleDeleteRoutine,
    handleRefreshRoutine,
  } = useRoutines();

  const { addEntity: addRoutine, updateEntity: updateRoutine } =
    useRoutineStore();

  const { player, modifyAura } = useDashboardStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const [routineText, setRoutineText] = useState("");
  const [routineConfig, setRoutineConfig] = useState({
    period: "days" as "days" | "weeks" | "months",
    value: 1,
    isGoodRoutine: true,
  });
  const [showRoutineForm, setShowRoutineForm] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  const [startDay, setStartDay] = useState<number>(new Date().getDate());
  const [startMonth, setStartMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [startYear, setStartYear] = useState<number>(new Date().getFullYear());
  const [formError, setFormError] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {}, [error]);

  const isValidDate = (d: number, m: number, y: number): boolean => {
    const date = new Date(y, m - 1, d);
    return (
      date.getFullYear() === y &&
      date.getMonth() === m - 1 &&
      date.getDate() === d
    );
  };

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    setRoutineText(routine.name);
    setRoutineConfig({
      period: routine.occurence,
      value: routine.x_occurence,
      isGoodRoutine: routine.aura >= 0,
    });

    const existingStartDate = parseDate(routine.start_date);
    setStartDay(existingStartDate.getDate());
    setStartMonth(existingStartDate.getMonth() + 1);
    setStartYear(existingStartDate.getFullYear());
    setFormError(null);
    setShowRoutineForm(true);
  };

  const handleSaveRoutine = (checklist: ChecklistItemData[]) => {
    if (!routineText?.trim()) {
      setFormError("Please enter a routine name");
      return;
    }

    if (!isValidDate(startDay, startMonth, startYear)) {
      setFormError("Invalid start date selected.");
      return;
    }
    const finalStartDate = new Date(startYear, startMonth - 1, startDay);
    finalStartDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (finalStartDate < today) {
      setFormError("Start date cannot be in the past.");
      return;
    }

    const formattedStartDate = formatDateToDDMMYY(finalStartDate);

    if (editingRoutine && editingRoutine.id) {
      const updatedRoutineDetails = {
        name: routineText,
        occurence: routineConfig.period,
        x_occurence: routineConfig.value,
        aura:
          Math.abs(editingRoutine.aura) *
          (routineConfig.isGoodRoutine ? 1 : -1),
        checklist: checklist,
        start_date: formattedStartDate,
      };
      updateRoutine(editingRoutine.id, updatedRoutineDetails);
    } else {
      if (player?.username) {
        const auraSign = routineConfig.isGoodRoutine ? 1 : -1;
        const routineData = {
          userId: player.username,
          name: routineText,
          occurence: routineConfig.period,
          x_occurence: routineConfig.value,
          aura: getAuraValue("routine") * auraSign,
          start_date: formattedStartDate,
          last_completed: formattedStartDate,
          checklist: checklist,
        };
        addRoutine(routineData);
      } else {
        setError("Cannot add routine: User not found.");
        console.error("User not found in dashboard store when adding routine.");

        return;
      }
    }

    setShowRoutineForm(false);
    setEditingRoutine(null);
    setRoutineText("");
    setFormError(null);
    inputRef.current?.focus();
  };

  if (isLoading && !sortedRoutines.length) {
    return (
      <p className="text-center text-muted-foreground">Loading routines...</p>
    );
  }
  if (error) {
    return <p className="text-center text-destructive">Error: {error}</p>;
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
            setRoutineConfig({ period: "days", value: 1, isGoodRoutine: true });

            const today = new Date();
            setStartDay(today.getDate());
            setStartMonth(today.getMonth() + 1);
            setStartYear(today.getFullYear());
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
          <DynamicRoutineForm
            routineText={routineText}
            setRoutineText={setRoutineText}
            routineConfig={routineConfig}
            setRoutineConfig={setRoutineConfig}
            startDay={startDay}
            setStartDay={setStartDay}
            startMonth={startMonth}
            setStartMonth={setStartMonth}
            startYear={startYear}
            setStartYear={setStartYear}
            currentYear={currentYear}
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
