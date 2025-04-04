import { create, StateCreator } from "zustand";
import { persist, createJSONStorage, PersistOptions } from "zustand/middleware";
import { Routine, Frequency } from "@/lib/interfaces/routine"; // Use local interface and Frequency type
import { ChecklistItemData } from "@/components/ui/checklist-item";
import { calculateNextDueDate } from "@/lib/utils";
// Import the actual API functions
import {
  fetchRoutinesAPI,
  addRoutineAPI,
  updateRoutineAPI,
  deleteRoutineAPI,
} from "@/lib/apiClient";

interface RoutineState {
  routines: Routine[];
  isLoading: boolean;
  error: string | null;
  fetchRoutines: () => Promise<void>;
  addRoutine: (
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
  ) => Promise<Routine | null>;
  updateRoutine: (
    routineId: string,
    updatedRoutineData: {
      name: string;
      frequency?: Frequency;
      checklist: ChecklistItemData[];
    } // Use correct Frequency type
  ) => Promise<void>;
  deleteRoutine: (routineId: string) => Promise<void>;
  toggleChecklistItem: (
    routineId: string,
    itemId: string
  ) => Promise<{
    itemCompleted?: boolean;
    routineCompleted?: boolean;
    auraChange?: number;
    nextDue?: Date | undefined;
    error?: string;
  }>;
  updateChecklistItem: (
    routineId: string,
    itemId: string,
    text: string
  ) => Promise<void>;
  deleteChecklistItem: (routineId: string, itemId: string) => Promise<void>;
  indentChecklistItem: (routineId: string, itemId: string) => Promise<void>;
  outdentChecklistItem: (routineId: string, itemId: string) => Promise<void>;
  addChecklistItem: (
    routineId: string,
    afterItemId: string | null,
    level: number
  ) => Promise<ChecklistItemData | null>;
  reorderChecklist: (
    routineId: string,
    newChecklistOrder: ChecklistItemData[]
  ) => Promise<void>;
}

type PersistedRoutineState = {
  routines: Routine[];
};

const routineStoreCreator: StateCreator<RoutineState> = (set, get) => ({
  routines: [],
  isLoading: false,
  error: null,

  fetchRoutines: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const fetchedRoutines = await fetchRoutinesAPI(); // API client now returns correct frontend Routine[] type
      set({ routines: fetchedRoutines, isLoading: false, error: null });
    } catch (err) {
      console.error("Failed to fetch routines:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      set({
        error: `Failed to load routines: ${errorMsg}`,
        isLoading: false,
        routines: [],
      });
    }
  },

  addRoutine: async (routineData) => {
    set({ isLoading: true });
    try {
      // Prepare payload for API
      const payload = {
        name: routineData.name,
        frequency: routineData.frequency, // Use Frequency type
        // Send only necessary data for checklist creation
        checklist: routineData.checklist.map((item) => ({
          text: item.text,
          level: item.level,
        })),
      };
      const addedRoutine = await addRoutineAPI(payload); // API client returns frontend Routine type

      set((state) => ({
        routines: [addedRoutine, ...state.routines], // Add the correctly typed routine
        isLoading: false,
        error: null,
      }));
      return addedRoutine;
    } catch (err) {
      console.error("Failed to add routine:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: `Failed to add routine: ${errorMsg}`, isLoading: false });
      return null;
    }
  },

  updateRoutine: async (routineId, updatedRoutineData) => {
    const originalRoutines = get().routines;
    // Optimistic update using frontend types
    set((state) => ({
      routines: state.routines.map((r) => {
        if (r.id === routineId) {
          const updated: Routine = {
            // Ensure optimistic update matches Routine interface
            ...r,
            name: updatedRoutineData.name,
            ...(updatedRoutineData.frequency && {
              frequency: updatedRoutineData.frequency, // Use Frequency type
              nextDue:
                calculateNextDueDate(
                  new Date(),
                  updatedRoutineData.frequency
                ) ?? undefined,
            }),
            // Optimistically update checklist (ensure it matches ChecklistItemData)
            checklist: updatedRoutineData.checklist.map((item) => ({
              id: item.id,
              text: item.text,
              completed: item.completed,
              level: item.level,
              children: item.children || [], // Ensure children array exists
            })),
          };
          return updated;
        }
        return r;
      }),
      error: null,
    }));

    try {
      // Prepare payload for API
      const payload = {
        name: updatedRoutineData.name,
        frequency: updatedRoutineData.frequency, // Use Frequency type
        // Send checklist items with necessary fields for upsert
        checklist: updatedRoutineData.checklist.map((item) => ({
          id: item.id,
          text: item.text,
          completed: item.completed,
          level: item.level,
        })),
      };
      const updatedRoutine = await updateRoutineAPI(routineId, payload); // API client returns frontend Routine type

      // Update state with confirmed data
      set((state) => ({
        routines: state.routines.map((r) =>
          r.id === routineId ? updatedRoutine : r
        ), // Use the returned routine directly
        error: null,
      }));
    } catch (err) {
      console.error(`Failed to update routine ${routineId}:`, err);
      set({
        routines: originalRoutines,
        error: `Failed to update routine: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
    }
  },

  deleteRoutine: async (routineId) => {
    const originalRoutines = get().routines;
    set((state) => ({
      routines: state.routines.filter((r) => r.id !== routineId),
      error: null,
    })); // Optimistic

    try {
      await deleteRoutineAPI(routineId); // Call API
      set({ error: null });
    } catch (err) {
      console.error(`Failed to delete routine ${routineId}:`, err);
      set({
        routines: originalRoutines,
        error: `Failed to delete routine: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
    }
  },

  // --- Checklist Item Actions ---
  toggleChecklistItem: async (routineId, itemId) => {
    const originalRoutines = get().routines;
    const routine = originalRoutines.find((r) => r.id === routineId);
    if (!routine) return { error: "Routine not found" };

    let itemCompleted = false;
    let routineCompleted = routine.completed;
    let auraChangeForItem = 0; // Aura change for this specific item toggle

    const updatedChecklist = routine.checklist.map((item) => {
      if (item.id === itemId) {
        itemCompleted = !item.completed;
        // Assign a fixed aura value per checklist item for now
        // Positive when completing, negative when uncompleting
        auraChangeForItem = itemCompleted ? 5 : -5;
        return { ...item, completed: itemCompleted };
      }
      return item;
    });

    const allItemsCompleted = updatedChecklist.every((item) => item.completed);
    if (allItemsCompleted && !routine.completed) {
      routineCompleted = true;
    } else if (!allItemsCompleted && routine.completed) {
      routineCompleted = false;
    }

    // Optimistic UI update
    set((state) => ({
      routines: state.routines.map((r) =>
        r.id === routineId
          ? { ...r, checklist: updatedChecklist, completed: routineCompleted }
          : r
      ),
      error: null,
    }));

    try {
      // Call updateRoutineAPI with the new checklist state AND the calculated routine completion status
      const payload = {
        name: routine.name,
        frequency: routine.frequency, // Use correct Frequency type
        completed: routineCompleted, // Send the calculated completion status
        checklist: updatedChecklist.map((item) => ({
          // Map to expected payload for API
          id: item.id,
          text: item.text,
          completed: item.completed,
          level: item.level,
        })),
      };
      const updatedRoutineResult = await updateRoutineAPI(routineId, payload); // API client returns frontend Routine type

      // Update store with confirmed state from API
      set((state) => ({
        routines: state.routines.map((r) =>
          r.id === routineId ? updatedRoutineResult : r
        ),
        error: null,
      }));

      // Return results, including the calculated aura change for the item
      return {
        itemCompleted,
        routineCompleted,
        auraChange: auraChangeForItem, // Return the change for this item
        nextDue: updatedRoutineResult.nextDue,
      };
    } catch (err) {
      console.error(
        `Failed to toggle checklist item ${itemId} via updateRoutine:`,
        err
      );
      set({
        routines: originalRoutines,
        error: `Failed to toggle item: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
      return { error: err instanceof Error ? err.message : "Unknown error" };
    }
  },

  updateChecklistItem: async (routineId, itemId, text) => {
    const originalRoutines = get().routines;
    const routine = originalRoutines.find((r) => r.id === routineId);
    if (!routine) return;

    const updatedChecklist = routine.checklist.map((item) =>
      item.id === itemId ? { ...item, text } : item
    );

    set((state) => ({
      routines: state.routines.map((r) =>
        r.id === routineId ? { ...r, checklist: updatedChecklist } : r
      ),
    })); // Optimistic

    try {
      await updateRoutineAPI(routineId, {
        name: routine.name,
        frequency: routine.frequency, // Use correct Frequency type
        checklist: updatedChecklist.map((item) => ({
          // Map to expected payload
          id: item.id,
          text: item.text,
          completed: item.completed,
          level: item.level,
        })),
      });
      set({ error: null });
    } catch (err) {
      console.error(`Failed to update checklist item ${itemId} text:`, err);
      set({
        routines: originalRoutines,
        error: `Failed to update item text: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
    }
  },

  deleteChecklistItem: async (routineId, itemId) => {
    const originalRoutines = get().routines;
    const routine = originalRoutines.find((r) => r.id === routineId);
    if (!routine) return;

    const updatedChecklist = routine.checklist.filter(
      (item) => item.id !== itemId
    );

    set((state) => ({
      routines: state.routines.map((r) =>
        r.id === routineId ? { ...r, checklist: updatedChecklist } : r
      ),
    })); // Optimistic

    try {
      await updateRoutineAPI(routineId, {
        name: routine.name,
        frequency: routine.frequency, // Use correct Frequency type
        checklist: updatedChecklist.map((item) => ({
          // Map to expected payload
          id: item.id,
          text: item.text,
          completed: item.completed,
          level: item.level,
        })),
      });
      set({ error: null });
    } catch (err) {
      console.error(`Failed to delete checklist item ${itemId}:`, err);
      set({
        routines: originalRoutines,
        error: `Failed to delete item: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
    }
  },

  addChecklistItem: async (routineId, afterItemId, level) => {
    const originalRoutines = get().routines;
    const routine = originalRoutines.find((r) => r.id === routineId);
    if (!routine) return null;

    const newItem: ChecklistItemData = {
      id: `temp-${Math.random().toString(36).substring(7)}`, // Temporary ID
      text: "",
      completed: false,
      level: level,
      children: [],
    };

    const index = afterItemId
      ? routine.checklist.findIndex((item) => item.id === afterItemId)
      : -1;
    const newChecklist = [...routine.checklist];
    newChecklist.splice(index + 1, 0, newItem);

    set((state) => ({
      routines: state.routines.map((r) =>
        r.id === routineId ? { ...r, checklist: newChecklist } : r
      ),
    })); // Optimistic

    try {
      const updatedRoutineResult = await updateRoutineAPI(routineId, {
        name: routine.name,
        frequency: routine.frequency, // Use correct Frequency type
        checklist: newChecklist.map((item) => ({
          // Map to expected payload
          id: item.id.startsWith("temp-") ? undefined : item.id,
          text: item.text,
          completed: item.completed,
          level: item.level,
        })),
      });
      // Find the newly added item from the result
      const addedItem = updatedRoutineResult.checklist.find(
        (item) =>
          !originalRoutines
            .find((r) => r.id === routineId)
            ?.checklist.some((oc) => oc.id === item.id)
      );

      // Update store with confirmed state
      set((state) => ({
        routines: state.routines.map((r) =>
          r.id === routineId ? updatedRoutineResult : r
        ),
        error: null,
      }));

      // Return the item confirmed by the backend (cast to ChecklistItemData)
      return addedItem
        ? ({
            id: addedItem.id,
            text: addedItem.text,
            completed: addedItem.completed,
            level: addedItem.level,
            children: addedItem.children || [],
          } as ChecklistItemData)
        : null;
    } catch (err) {
      console.error(`Failed to add checklist item:`, err);
      set({
        routines: originalRoutines,
        error: `Failed to add item: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
      return null;
    }
  },

  reorderChecklist: async (routineId, newChecklistOrder) => {
    const originalRoutines = get().routines;
    const routine = originalRoutines.find((r) => r.id === routineId);
    if (!routine) return;

    // Optimistic update
    set((state) => ({
      routines: state.routines.map((r) =>
        r.id === routineId ? { ...r, checklist: newChecklistOrder } : r
      ),
    }));

    try {
      await updateRoutineAPI(routineId, {
        name: routine.name,
        frequency: routine.frequency, // Use correct Frequency type
        checklist: newChecklistOrder.map((item) => ({
          // Map to expected payload
          id: item.id,
          text: item.text,
          completed: item.completed,
          level: item.level,
        })),
      });
      set({ error: null });
    } catch (err) {
      console.error(
        `Failed to reorder checklist for routine ${routineId}:`,
        err
      );
      set({
        routines: originalRoutines,
        error: `Failed to reorder checklist: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
    }
  },

  indentChecklistItem: async (routineId, itemId) => {
    const originalRoutines = get().routines;
    const routine = originalRoutines.find((r) => r.id === routineId);
    if (!routine) return;

    let updatedChecklist = [...routine.checklist];
    const index = updatedChecklist.findIndex((item) => item.id === itemId);
    if (index > 0) {
      const currentLevel = updatedChecklist[index].level;
      const prevLevel = updatedChecklist[index - 1].level;
      updatedChecklist[index] = {
        ...updatedChecklist[index],
        level: Math.min(currentLevel + 1, prevLevel + 1),
      };

      set((state) => ({
        routines: state.routines.map((r) =>
          r.id === routineId ? { ...r, checklist: updatedChecklist } : r
        ),
      })); // Optimistic

      try {
        await updateRoutineAPI(routineId, {
          name: routine.name,
          frequency: routine.frequency,
          checklist: updatedChecklist.map((item) => ({
            id: item.id,
            text: item.text,
            completed: item.completed,
            level: item.level,
          })),
        });
        set({ error: null });
      } catch (err) {
        console.error(`Failed to indent item ${itemId}:`, err);
        set({
          routines: originalRoutines,
          error: `Failed to indent item: ${
            err instanceof Error ? err.message : "Unknown error"
          }`,
        });
      }
    }
  },
  outdentChecklistItem: async (routineId, itemId) => {
    const originalRoutines = get().routines;
    const routine = originalRoutines.find((r) => r.id === routineId);
    if (!routine) return;

    const updatedChecklist = routine.checklist.map((item) =>
      item.id === itemId
        ? { ...item, level: Math.max(0, item.level - 1) }
        : item
    );

    set((state) => ({
      routines: state.routines.map((r) =>
        r.id === routineId ? { ...r, checklist: updatedChecklist } : r
      ),
    })); // Optimistic

    try {
      await updateRoutineAPI(routineId, {
        name: routine.name,
        frequency: routine.frequency,
        checklist: updatedChecklist.map((item) => ({
          id: item.id,
          text: item.text,
          completed: item.completed,
          level: item.level,
        })),
      });
      set({ error: null });
    } catch (err) {
      console.error(`Failed to outdent item ${itemId}:`, err);
      set({
        routines: originalRoutines,
        error: `Failed to outdent item: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
    }
  },
});

// Create the store WITH persist middleware applied correctly
const useRoutineStore = create<RoutineState>()(
  persist(routineStoreCreator, {
    name: "routine-storage",
    storage: createJSONStorage(() => localStorage),
    partialize: (state): PersistedRoutineState => ({
      routines: state.routines,
    }),
    onRehydrateStorage: () => {
      console.log("Attempting hydration for routines...");
      return (state, error) => {
        if (error) {
          console.error("Failed to hydrate routines:", error);
          return;
        }
        if (state) {
          state.routines = state.routines.map((r: any) => ({
            // Use any temporarily
            ...r,
            frequency: r.frequency as Frequency, // Ensure frequency type on rehydrate
            createdAt: new Date(r.createdAt),
            updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
            lastCompleted: r.lastCompleted
              ? new Date(r.lastCompleted)
              : undefined,
            nextDue: r.nextDue ? new Date(r.nextDue) : undefined,
            checklist: (r.checklist || []).map((item: any) => ({
              // Ensure checklist items match interface
              id: item.id,
              text: item.text,
              completed: item.completed,
              level: item.level,
              children: item.children || [],
            })),
          }));
          state.isLoading = false;
          state.error = null;
          console.log("Routine hydration successful.");
        } else {
          console.log("No persisted routine state found.");
        }
      };
    },
    version: 1,
  })
);

export default useRoutineStore;
