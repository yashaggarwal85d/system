"use client";

import { useState, useRef } from "react";
import { motion, Reorder } from "framer-motion";
import { PlusCircle, Sparkles, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChecklistItem,
  ChecklistItemData,
} from "@/components/ui/checklist-item";
import RoutineForm from "./RoutineForm";
import useRoutineStore from "@/store/routineStore";
import useDashboardStore from "@/store/dashboardStore";
import { Routine } from "@/lib/interfaces/routine";
import { getRemainingTime } from "@/lib/utils";
import { containerVariants, itemVariants } from "@/lib/utils/animations";

const RoutinesContainer = () => {
  const {
    routines,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    toggleChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    indentChecklistItem,
    outdentChecklistItem,
    addChecklistItem,
    reorderChecklist,
  } = useRoutineStore();
  const { addAura, subtractAura } = useDashboardStore();

  const [newTaskText, setNewTaskText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showRoutineForm, setShowRoutineForm] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | undefined>(
    undefined
  );

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    setNewTaskText(routine.name);
    setShowRoutineForm(true);
  };

  const handleSaveRoutine = (
    routineData: Omit<
      Routine,
      | "id"
      | "createdAt"
      | "completed"
      | "auraValue"
      | "nextDue"
      | "lastCompleted"
    >
  ) => {
    if (editingRoutine) {
      updateRoutine(editingRoutine.id, {
        name: routineData.name,
        frequency: routineData.frequency,
        checklist: routineData.checklist,
      });
    } else {
      addRoutine(routineData);
    }

    setShowRoutineForm(false);
    setNewTaskText("");
    setEditingRoutine(undefined);
  };

  const handleToggleChecklistItem = async (
    routineId: string,
    itemId: string
  ) => {
    // Make async
    const result = await toggleChecklistItem(routineId, itemId); // Await result

    // Check for errors from the API call
    if (result.error) {
      console.error("Failed to toggle checklist item:", result.error);
      // Optionally show a toast or message to the user
      return;
    }

    // Use the auraChange from the result
    if (result.auraChange && result.auraChange > 0) {
      addAura(result.auraChange);
    } else if (result.auraChange && result.auraChange < 0) {
      subtractAura(Math.abs(result.auraChange));
    }
    // Note: routineCompleted and itemCompleted from result could be used for further UI updates if needed
  };

  const handleDeleteRoutine = (routineId: string) => {
    deleteRoutine(routineId);
  };

  const openAddRoutineForm = () => {
    setEditingRoutine(undefined);
    // Keep the existing newTaskText
    setShowRoutineForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          ref={inputRef}
          placeholder="New routine name..."
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newTaskText.trim()) {
              openAddRoutineForm();
            }
          }}
          className="bg-[#0A1A2F]/60 border-[#4ADEF6]/20 focus:border-[#4ADEF6]/50 placeholder:text-[#4ADEF6]/30"
        />
        <Button
          onClick={openAddRoutineForm}
          className="gap-2 bg-[#4ADEF6]/20 text-[#4ADEF6] hover:bg-[#4ADEF6]/30 border border-[#4ADEF6]/50 whitespace-nowrap"
        >
          <PlusCircle className="h-4 w-4" /> Add Routine
        </Button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
        layout
      >
        {routines.map((routine) => (
          <motion.div key={routine.id} variants={itemVariants} layout>
            <Card className="bg-[#0A1A2F]/60 border-[#4ADEF6]/20 hover:border-[#4ADEF6]/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span
                        className={`text-[#4ADEF6] ${
                          routine.completed ? "line-through opacity-50" : ""
                        }`}
                      >
                        {routine.name}
                      </span>
                      {routine.frequency && (
                        <span className="text-xs text-[#4ADEF6]/70">
                          {routine.frequency.count} times per{" "}
                          {routine.frequency.value} {routine.frequency.period}
                          {routine.nextDue && (
                            <span
                              className={`ml-2 ${
                                getRemainingTime(routine.nextDue) === "Overdue"
                                  ? "text-red-500"
                                  : ""
                              }`}
                            >
                              {getRemainingTime(routine.nextDue)}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleEditRoutine(routine)}
                      className="h-8 w-8 p-0 bg-[#4ADEF6]/20 hover:bg-[#4ADEF6]/30 border-[#4ADEF6]/50 text-[#4ADEF6]"
                      aria-label={`Edit routine ${routine.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteRoutine(routine.id)}
                      className="h-8 w-8 p-0 bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-500"
                      aria-label={`Delete routine ${routine.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Reorder.Group
                    axis="y"
                    values={routine.checklist}
                    onReorder={(newOrder: ChecklistItemData[]) =>
                      reorderChecklist(routine.id, newOrder)
                    }
                  >
                    {routine.checklist.map((item) => (
                      <ChecklistItem
                        key={item.id}
                        item={item}
                        onUpdate={(id, updates) => {
                          if (
                            "text" in updates &&
                            typeof updates.text === "string"
                          ) {
                            updateChecklistItem(routine.id, id, updates.text);
                          } else if ("completed" in updates) {
                            handleToggleChecklistItem(routine.id, id);
                          }
                        }}
                        onDelete={(id) => deleteChecklistItem(routine.id, id)}
                        onIndent={(id) => indentChecklistItem(routine.id, id)}
                        onOutdent={(id) => outdentChecklistItem(routine.id, id)}
                        onEnter={(id, level) =>
                          addChecklistItem(routine.id, id, level)
                        }
                        onFocus={() => {}}
                        dragControls={null}
                        isEditing={false}
                      />
                    ))}
                  </Reorder.Group>
                </div>

                {routine.completed && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2 mt-4"
                  >
                    <Sparkles className="h-4 w-4 text-[#4ADEF6] animate-pulse" />
                    <span className="text-xs text-[#4ADEF6]/80">
                      Routine Complete!
                    </span>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {showRoutineForm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <RoutineForm
            initialName={newTaskText}
            onNameChange={setNewTaskText}
            onSave={handleSaveRoutine}
            onClose={() => {
              setShowRoutineForm(false);
              setNewTaskText("");
              setEditingRoutine(undefined);
            }}
            initialRoutine={editingRoutine}
          />
        </motion.div>
      )}
    </div>
  );
};

export default RoutinesContainer;
