"use client";

import { useState, useRef, useEffect, useMemo } from "react"; // Import useEffect and useMemo
import { motion, Reorder } from "framer-motion";
import { PlusCircle, Sparkles, Pencil, Trash2, TimerReset } from "lucide-react"; // Added TimerReset
import { Input } from "@/components/common/input";
import { Button } from "@/components/common/button";
import { Card, CardContent } from "@/components/common/card";
import {
  ChecklistItem,
  ChecklistItemData,
} from "@/components/common/checklist-item";
import RoutineForm from "./RoutineForm";
import useRoutineStore from "@/store/routineStore";
import useDashboardStore from "@/store/dashboardStore"; // Keep dashboard store import
import { Routine } from "@/lib/utils/interfaces"; // Keep this import
import {
  getRemainingTime,
  calculateNextDueDate,
} from "@/lib/utils/commonUtils"; // Keep these imports
import { containerVariants, itemVariants } from "@/lib/utils/animationUtils";
import { useSession } from "next-auth/react"; // Keep useSession import

const RoutinesContainer = () => {
  const { data: session, status } = useSession(); // Get session status
  // Correct store destructuring: Use Routines, remove non-existent actions
  const {
    Routines,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    isLoading,
    error: routineError, // Get store error state
  } = useRoutineStore();
  const { modifyAura } = useDashboardStore(); // Keep modifyAura

  const [newTaskText, setNewTaskText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showRoutineForm, setShowRoutineForm] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | undefined>(
    undefined
  );
  const [componentError, setComponentError] = useState<string | null>(null); // Add local error state

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    setNewTaskText(routine.name);
    setShowRoutineForm(true);
  };

  // Revert type for handleSaveRoutine parameter
  const handleSaveRoutine = (
    routineData: Omit<Routine, "id" | "checklist"> & {
      checklist: ChecklistItemData[];
    }
  ) => {
    // Stringify checklist before saving
    let checklistString: string;
    try {
      checklistString = JSON.stringify(routineData.checklist || []);
    } catch (error) {
      console.error("Failed to stringify checklist:", error);
      // Handle error appropriately, maybe show a message to the user
      return; // Prevent saving with invalid checklist
    }

    if (editingRoutine && editingRoutine.id) {
      // Prepare update payload matching Partial<Routine>
      const updatePayload: Partial<Routine> = {
        name: routineData.name,
        occurence: routineData.occurence,
        x_occurence: routineData.x_occurence,
        repeat: routineData.repeat,
        aura: routineData.aura,
        checklist: checklistString, // Pass stringified checklist
        // start_date is usually not updated, next_due_date might be recalculated by backend/store
      };
      updateRoutine(editingRoutine.id, updatePayload);
    } else {
      // Prepare arguments for addRoutine store action
      const name = routineData.name;
      const startDate = new Date(routineData.start_date); // Expect start_date from form
      const occurence = routineData.occurence;
      const x_occurence = routineData.x_occurence;
      const repeat = routineData.repeat;
      // addRoutine expects checklist string as the last argument
      addRoutine(
        name,
        startDate,
        occurence,
        x_occurence,
        repeat,
        checklistString
      );
      // Note: Store calculates next_due_date and aura internally
    }
    setShowRoutineForm(false);
    setNewTaskText("");
    setEditingRoutine(undefined);
    setComponentError(null); // Clear local error on save
  };

  // Implement toggle logic similar to Tasks/Habits (advance date, grant aura)
  const handleToggleRoutine = async (routineId: string | undefined) => {
    setComponentError(null); // Clear local error on action
    if (!routineId) {
      console.error("Routine ID is undefined, cannot toggle.");
      setComponentError("Failed to toggle routine: Missing ID.");
      return;
    }

    const routine = Routines.find((r) => r.id === routineId);
    if (!routine) {
      console.error("Routine not found:", routineId);
      setComponentError("Failed to toggle routine: Routine not found.");
      return;
    }

    // Determine if the routine is currently "due" (past or today)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const currentNextDue = routine.next_due_date
      ? new Date(routine.next_due_date)
      : null;
    const isDue = currentNextDue ? currentNextDue <= now : true; // Consider due if no date or past date

    if (!isDue) {
      console.log("Routine is not due yet, cannot complete early.");
      // Optionally show a message to the user
      return;
    }

    try {
      // Calculate the *next* next_due_date based on the current one
      const baseDateForCalc = currentNextDue || new Date(); // Use current due date or now as base
      const nextDueDate = calculateNextDueDate(
        baseDateForCalc,
        routine.occurence,
        routine.x_occurence,
        routine.repeat
      );

      // Update the routine with the new next_due_date
      await updateRoutine(routineId, {
        next_due_date: nextDueDate.toISOString(),
      });

      // Apply aura change upon completion (advancing the date)
      modifyAura(routine.aura ?? 0); // Use routine's aura value
    } catch (updateError) {
      console.error("Failed to update routine state:", updateError);
      setComponentError(
        `Failed to update routine: ${
          updateError instanceof Error ? updateError.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteRoutine = (routineId: string | undefined) => {
    setComponentError(null); // Clear local error on action
    if (routineId) {
      deleteRoutine(routineId); // Assuming this doesn't throw errors handled here
    } else {
      console.error("Cannot delete routine without ID");
      setComponentError("Failed to delete routine: Missing ID.");
    }
  };

  const openAddRoutineForm = (initialText: string = "") => {
    // Accept optional initial text
    setEditingRoutine(undefined);
    setNewTaskText(initialText); // Set the text from input if provided
    setShowRoutineForm(true);
    setComponentError(null); // Clear error when opening form
  };

  // Function to handle checklist item updates and save the whole routine
  const handleChecklistChange = (
    routineId: string | undefined,
    updatedChecklist: ChecklistItemData[]
  ) => {
    if (!routineId) {
      console.error("Cannot update checklist without Routine ID");
      setComponentError("Failed to update checklist: Missing Routine ID.");
      return;
    }
    try {
      const checklistString = JSON.stringify(updatedChecklist);
      updateRoutine(routineId, { checklist: checklistString });
    } catch (error) {
      console.error("Failed to stringify checklist on update:", error);
      setComponentError("Failed to save checklist changes.");
    }
  };

  // Sort routines: primarily by next_due_date (ascending, null/undefined last), then by start_date
  const sortedRoutines = useMemo(() => {
    // Use Routines (capital R)
    return [...Routines].sort((a, b) => {
      // Use next_due_date and start_date from Routine interface
      const nextDueA = a.next_due_date
        ? new Date(a.next_due_date).getTime()
        : Infinity;
      const nextDueB = b.next_due_date
        ? new Date(b.next_due_date).getTime()
        : Infinity;

      const validNextDueA = isNaN(nextDueA) ? Infinity : nextDueA;
      const validNextDueB = isNaN(nextDueB) ? Infinity : nextDueB;

      if (validNextDueA !== validNextDueB) {
        return validNextDueA - validNextDueB;
      }

      const startDateA = a.start_date
        ? new Date(a.start_date).getTime()
        : Infinity;
      const startDateB = b.start_date
        ? new Date(b.start_date).getTime()
        : Infinity;

      const validStartDateA = isNaN(startDateA) ? Infinity : startDateA;
      const validStartDateB = isNaN(startDateB) ? Infinity : startDateB;

      return validStartDateA - validStartDateB;
    });
  }, [Routines]); // Depend on Routines

  // Render Loading/Error states
  if (isLoading && !Routines.length) {
    // Use Routines
    // Check sortedRoutines length
    // Show loading only on initial load
    return (
      <p className="text-center text-muted-foreground">Loading routines...</p>
    );
  }
  // Display local or store error
  const displayError = componentError || routineError;
  if (displayError) {
    return <p className="text-center text-red-500">Error: {displayError}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          ref={inputRef}
          placeholder="New routine name..."
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          // Keep onKeyDown to allow opening form with Enter
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
        {sortedRoutines.map((routine: Routine) => {
          // Map over sortedRoutines
          // Parse checklist string into array
          let checklistItems: ChecklistItemData[] = [];
          try {
            // Ensure routine.checklist is a non-empty string before parsing
            if (routine.checklist && typeof routine.checklist === "string") {
              checklistItems = JSON.parse(routine.checklist);
              // Basic validation if needed: ensure it's an array
              if (!Array.isArray(checklistItems)) {
                console.warn(
                  `Parsed checklist for routine ${routine.id} is not an array.`,
                  checklistItems
                );
                checklistItems = [];
              }
            }
          } catch (error) {
            console.error(
              `Failed to parse checklist for routine ${routine.id}:`,
              error
            );
            // Keep checklistItems as empty array on error
          }

          // Convert next_due_date string to Date object for getRemainingTime
          const nextDueDate = routine.next_due_date
            ? new Date(routine.next_due_date)
            : undefined;
          const nextDueDateString =
            nextDueDate && !isNaN(nextDueDate.getTime())
              ? routine.next_due_date // Use original string for util
              : undefined;

          // Determine if routine is 'completed' (e.g., all checklist items done)
          const isRoutineCompleted =
            checklistItems.length > 0 &&
            checklistItems.every((item) => item.completed);

          return (
            // Add onClick to the wrapper div to toggle/complete the routine
            <motion.div
              key={routine.id}
              variants={itemVariants}
              layout
              onClick={() => handleToggleRoutine(routine.id)} // Add toggle handler here
              className="cursor-pointer" // Keep cursor pointer
            >
              <Card className="bg-[#0A1A2F]/60 border-[#4ADEF6]/20 hover:border-[#4ADEF6]/40 transition-colors group">
                <CardContent className="p-4">
                  {/* Add onClick to CardContent to trigger toggle, allows buttons inside */}
                  <div
                    className="flex items-center justify-between mb-4"
                    onClick={() => handleToggleRoutine(routine.id)} // Move toggle here
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span
                          className={`text-[#4ADEF6] ${
                            isRoutineCompleted ? "line-through opacity-50" : "" // Use derived completion status
                          }`}
                        >
                          {routine.name}
                        </span>
                        {/* Show Frequency/Next Due using Routine properties */}
                        {!isRoutineCompleted && ( // Show only if incomplete
                          <span className="text-xs text-[#4ADEF6]/70">
                            {/* Display frequency based on occurence/x_occurence/repeat */}
                            {routine.repeat} times per {routine.x_occurence}{" "}
                            {routine.occurence}
                            {nextDueDateString && (
                              <span
                                className={`ml-2 ${
                                  getRemainingTime(nextDueDateString) ===
                                  "Overdue"
                                    ? "text-red-500"
                                    : ""
                                }`}
                              >
                                {/* Use nextDueDateString */}
                                {getRemainingTime(nextDueDateString)}
                              </span>
                            )}
                          </span>
                        )}
                        {/* Show Reset Time if Routine is Completed */}
                        {isRoutineCompleted && nextDueDateString && (
                          <span className="text-xs text-green-500 flex items-center gap-1 mt-1">
                            <TimerReset className="h-3 w-3" />
                            {/* Removed formatResetTime call */}
                            Resets {getRemainingTime(nextDueDateString)}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Stop propagation on buttons to prevent card onClick */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          handleEditRoutine(routine);
                        }}
                        className="h-8 w-8 p-0 bg-[#4ADEF6]/20 hover:bg-[#4ADEF6]/30 border-[#4ADEF6]/50 text-[#4ADEF6]"
                        aria-label={`Edit routine ${routine.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          handleDeleteRoutine(routine.id);
                        }}
                        className="h-8 w-8 p-0 bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-500"
                        aria-label={`Delete routine ${routine.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* Use parsed checklistItems */}
                    {checklistItems.length > 0 && (
                      <Reorder.Group
                        axis="y"
                        values={checklistItems}
                        onReorder={(newOrder: ChecklistItemData[]) => {
                          // Update routine with stringified new order
                          if (routine.id) {
                            updateRoutine(routine.id, {
                              checklist: JSON.stringify(newOrder),
                            });
                          }
                        }}
                      >
                        {/* Rely on type inference for item */}
                        {checklistItems.map((item) => (
                          <ChecklistItem
                            key={item.id}
                            item={item}
                            // Provide dummy/logging functions for missing store actions
                            // Implement checklist item updates by modifying the list and saving the whole routine
                            onUpdate={(itemId, updates) => {
                              const updatedList = checklistItems.map((ci) =>
                                ci.id === itemId ? { ...ci, ...updates } : ci
                              );
                              handleChecklistChange(routine.id, updatedList);
                            }}
                            onDelete={(itemId) => {
                              const updatedList = checklistItems.filter(
                                (ci) => ci.id !== itemId
                              );
                              handleChecklistChange(routine.id, updatedList);
                            }}
                            // Basic indent/outdent (adjust level, save)
                            onIndent={(itemId) => {
                              const updatedList = checklistItems.map((ci) =>
                                ci.id === itemId
                                  ? { ...ci, level: (ci.level || 0) + 1 }
                                  : ci
                              );
                              handleChecklistChange(routine.id, updatedList);
                            }}
                            onOutdent={(itemId) => {
                              const updatedList = checklistItems.map((ci) =>
                                ci.id === itemId
                                  ? {
                                      ...ci,
                                      level: Math.max(0, (ci.level || 0) - 1),
                                    }
                                  : ci
                              );
                              handleChecklistChange(routine.id, updatedList);
                            }}
                            // Add new item below current one on Enter
                            onEnter={(currentItemId, currentLevel) => {
                              const currentIndex = checklistItems.findIndex(
                                (ci) => ci.id === currentItemId
                              );
                              const newItem: ChecklistItemData = {
                                id: crypto.randomUUID(), // Generate unique ID
                                text: "",
                                completed: false,
                                level: currentLevel,
                                children: [], // Assuming no nested children handling for now
                              };
                              const updatedList = [
                                ...checklistItems.slice(0, currentIndex + 1),
                                newItem,
                                ...checklistItems.slice(currentIndex + 1),
                              ];
                              handleChecklistChange(routine.id, updatedList);
                              // TODO: Focus the new item - might need state management in ChecklistItem
                            }}
                            onFocus={() => {}} // Keep dummy prop
                            dragControls={null} // Keep dummy prop
                            isEditing={false} // Keep dummy prop
                            // Remove lastCompletedAura prop
                            // lastCompletedAura={...}
                          />
                        ))}
                      </Reorder.Group>
                    )}
                  </div>

                  {/* Use derived completion status */}
                  {isRoutineCompleted && (
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
          );
        })}
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
