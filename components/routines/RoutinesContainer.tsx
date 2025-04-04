"use client";

import { useState, useRef, useEffect, useMemo } from "react"; // Import useEffect and useMemo
import { motion, Reorder } from "framer-motion";
import { PlusCircle, Sparkles, Pencil, Trash2, TimerReset } from "lucide-react"; // Added TimerReset
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
import { getRemainingTime, formatResetTime } from "@/lib/utils"; // Added formatResetTime
import { containerVariants, itemVariants } from "@/lib/utils/animations";
import { useSession } from "next-auth/react"; // Import useSession

const RoutinesContainer = () => {
  const { data: session, status } = useSession(); // Get session status
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
    fetchRoutines, // Get fetch action
    isLoading,
    error: routineError, // Get loading/error state
  } = useRoutineStore();
  const { addAura, subtractAura } = useDashboardStore();

  const [newTaskText, setNewTaskText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showRoutineForm, setShowRoutineForm] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | undefined>(
    undefined
  );
  // State to store aura change per checklist item: { routineId: { itemId: auraChange } }
  const [lastItemAuraChanges, setLastItemAuraChanges] = useState<{
    [routineId: string]: { [itemId: string]: number };
  }>({});

  // Fetch routines when component mounts and user is authenticated
  useEffect(() => {
    if (status === "authenticated") {
      fetchRoutines();
    }
    // Optionally clear routines if status becomes unauthenticated?
  }, [status, fetchRoutines]);

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
      | "updatedAt"
      | "completed"
      | "nextDue"
      | "lastCompleted"
      | "userId"
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

  // Make async to handle promise from store action
  const handleToggleChecklistItem = async (
    routineId: string,
    itemId: string
  ) => {
    const result = await toggleChecklistItem(routineId, itemId); // Await result

    if (result.error) {
      console.error("Failed to toggle checklist item:", result.error);
      // TODO: Show error toast
      return;
    }

    // Apply aura change from result
    if (result.auraChange && result.auraChange > 0) {
      addAura(result.auraChange);
    } else if (result.auraChange && result.auraChange < 0) {
      subtractAura(Math.abs(result.auraChange));
    }

    // Store the aura change for this specific item
    if (result.auraChange !== undefined) {
      setLastItemAuraChanges((prev) => ({
        ...prev,
        [routineId]: {
          ...(prev[routineId] || {}),
          [itemId]: result.auraChange ?? 0,
        },
      }));
      // Optional: Clear the aura display after a short delay
      setTimeout(() => {
        setLastItemAuraChanges((prev) => {
          const routineChanges = { ...(prev[routineId] || {}) };
          delete routineChanges[itemId];
          return { ...prev, [routineId]: routineChanges };
        });
      }, 2000); // Clear after 2 seconds
    }
    // Potentially add routine completion aura based on result.routineCompleted
  };

  const handleDeleteRoutine = (routineId: string) => {
    deleteRoutine(routineId); // Fire-and-forget
  };

  const openAddRoutineForm = (initialText: string = "") => {
    // Accept optional initial text
    setEditingRoutine(undefined);
    setNewTaskText(initialText); // Set the text from input if provided
    setShowRoutineForm(true);
  };

  // Handle checklist updates that call updateRoutine in the store
  const handleChecklistUpdate = (
    routineId: string,
    updatedChecklist: ChecklistItemData[]
  ) => {
    const routine = routines.find((r) => r.id === routineId);
    if (routine) {
      updateRoutine(routineId, {
        name: routine.name,
        frequency: routine.frequency,
        checklist: updatedChecklist,
      });
    }
  };

  // Sort routines: by completion status (incomplete first), then by nextDue date (ascending, null/undefined last)
  const sortedRoutines = useMemo(() => {
    return [...routines].sort((a, b) => {
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
  }, [routines]);

  // Render Loading/Error states
  if (isLoading && !sortedRoutines.length) {
    // Check sortedRoutines length
    // Show loading only on initial load
    return (
      <p className="text-center text-muted-foreground">Loading routines...</p>
    );
  }
  if (routineError) {
    return (
      <p className="text-center text-red-500">
        Error loading routines: {routineError}
      </p>
    );
  }

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
              openAddRoutineForm(newTaskText); // Pass current text
            }
          }}
          className="bg-[#0A1A2F]/60 border-[#4ADEF6]/20 focus:border-[#4ADEF6]/50 placeholder:text-[#4ADEF6]/30"
        />
        <Button
          onClick={() => openAddRoutineForm(newTaskText)} // Pass current text
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
        {sortedRoutines.map(
          (
            routine // Map over sortedRoutines
          ) => (
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
                        {/* Show Frequency/Next Due OR Reset Time */}
                        {routine.frequency &&
                          !routine.completed && ( // Show only if incomplete
                            <span className="text-xs text-[#4ADEF6]/70">
                              {routine.frequency.count} times per{" "}
                              {routine.frequency.value}{" "}
                              {routine.frequency.period}
                              {routine.nextDue && (
                                <span
                                  className={`ml-2 ${
                                    getRemainingTime(routine.nextDue) ===
                                    "Overdue"
                                      ? "text-red-500"
                                      : ""
                                  }`}
                                >
                                  {getRemainingTime(routine.nextDue)}
                                </span>
                              )}
                            </span>
                          )}
                        {/* Show Reset Time if Routine is Completed */}
                        {routine.completed && routine.nextDue && (
                          <span className="text-xs text-green-500 flex items-center gap-1 mt-1">
                            <TimerReset className="h-3 w-3" />
                            {formatResetTime(routine.nextDue)}
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
                    {/* Ensure checklist is an array before mapping */}
                    {Array.isArray(routine.checklist) && (
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
                                updateChecklistItem(
                                  routine.id,
                                  id,
                                  updates.text
                                ); // Calls store action -> updateRoutine
                              } else if ("completed" in updates) {
                                handleToggleChecklistItem(routine.id, id); // Calls store action -> updateRoutine
                              }
                            }}
                            onDelete={(id) =>
                              deleteChecklistItem(routine.id, id)
                            } // Calls store action -> updateRoutine
                            onIndent={(id) =>
                              indentChecklistItem(routine.id, id)
                            } // Calls store action -> updateRoutine
                            onOutdent={(id) =>
                              outdentChecklistItem(routine.id, id)
                            } // Calls store action -> updateRoutine
                            onEnter={(id, level) =>
                              addChecklistItem(routine.id, id, level)
                            } // Calls store action -> updateRoutine
                            onFocus={() => {}}
                            dragControls={null}
                            isEditing={false}
                            // Pass the specific aura change for this item
                            lastCompletedAura={
                              lastItemAuraChanges[routine.id]?.[item.id]
                            }
                          />
                        ))}
                      </Reorder.Group>
                    )}
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
          )
        )}
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
