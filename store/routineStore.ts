import { create, StateCreator } from "zustand";
// Remove persist imports
import { Routine } from "@/lib/interfaces/routine";
import { ChecklistItemData } from "@/components/ui/checklist-item";
import { calculateNextDueDate, getAuraValue } from "@/lib/utils";
// TODO: Import API functions

interface RoutineState {
  routines: Routine[];
  isLoading: boolean;
  error: string | null;

  // setRoutines: (routines: Routine[] | ((prev: Routine[]) => Routine[])) => void; // Keep if needed
  fetchRoutines: () => Promise<void>;
  addRoutine: (
    routineData: Omit<
      Routine,
      | "id"
      | "createdAt"
      | "updatedAt" // Added
      | "completed"
      | "auraValue"
      | "nextDue"
      | "lastCompleted"
      | "userId" // Added
    >
  ) => Promise<Routine | null>;
  updateRoutine: (
    routineId: string,
    updatedRoutineData: Partial<
      Omit<Routine, "id" | "createdAt" | "updatedAt" | "userId">
    > // Exclude fields set by backend
  ) => Promise<void>;
  deleteRoutine: (routineId: string) => Promise<void>;
  toggleChecklistItem: (
    routineId: string,
    itemId: string
  ) => Promise<{
    // Return type might change
    itemCompleted?: boolean;
    routineCompleted?: boolean;
    auraChange?: number;
    nextDue?: Date;
    error?: string;
  }>;
  updateChecklistItem: (
    routineId: string,
    itemId: string,
    text: string
  ) => Promise<void>;
  deleteChecklistItem: (routineId: string, itemId: string) => Promise<void>;
  indentChecklistItem: (routineId: string, itemId: string) => Promise<void>; // These might become API calls or stay local UI state updates initially
  outdentChecklistItem: (routineId: string, itemId: string) => Promise<void>; // These might become API calls or stay local UI state updates initially
  addChecklistItem: (
    routineId: string,
    afterItemId: string | null,
    level: number
  ) => Promise<ChecklistItemData | null>; // Return new item or null
  reorderChecklist: (
    routineId: string,
    newChecklistOrder: ChecklistItemData[] // Send the whole new order
  ) => Promise<void>;
}

const routineStoreCreator: StateCreator<RoutineState> = (set, get) => ({
  routines: [],
  isLoading: true,
  error: null,

  // setRoutines: (updater) =>
  //   set((state) => ({
  //     routines:
  //       typeof updater === "function" ? updater(state.routines) : updater,
  //     isLoading: false, error: null
  //   })),

  fetchRoutines: async () => {
    set({ isLoading: true, error: null });
    try {
      // --- TODO: Replace with actual API call ---
      console.log("TODO: Fetch routines from API");
      // const fetchedRoutines = await fetchRoutinesAPI();
      // Convert dates...
      // set({ routines: routinesWithDates, isLoading: false });
      set({ routines: [], isLoading: false }); // Simulate empty fetch
      // --- End TODO ---
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
      const routinePayload = {
        ...routineData,
        auraValue: getAuraValue("routine"),
        nextDue: calculateNextDueDate(new Date(), routineData.frequency),
        // Ensure checklist items have basic structure if needed by API
        checklist: routineData.checklist.map((item) => ({
          text: item.text || "",
          level: item.level || 0,
          completed: !!item.completed,
        })),
        // id, createdAt, updatedAt, completed, lastCompleted, userId set by backend
      };
      // --- TODO: Replace with actual API call ---
      console.log("TODO: Call API to add routine:", routinePayload);
      // const addedRoutine = await addRoutineAPI(routinePayload);
      // Convert dates...
      // set((state) => ({ routines: [routineWithDates, ...state.routines], isLoading: false, error: null }));
      // return routineWithDates;

      // Simulate API response
      const simulatedRoutine: Routine = {
        ...routinePayload,
        id: Math.random().toString(36).substring(7),
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "temp-user-id",
        lastCompleted: undefined,
        // Simulate checklist items getting IDs from backend
        checklist: routinePayload.checklist.map((item) => ({
          ...item,
          id: Math.random().toString(36).substring(7),
          children: [],
        })),
      };
      set((state) => ({
        routines: [simulatedRoutine, ...state.routines],
        isLoading: false,
        error: null,
      }));
      return simulatedRoutine;
      // --- End TODO ---
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
    // Optimistic update
    set((state) => ({
      routines: state.routines.map((r) => {
        if (r.id === routineId) {
          const updated = { ...r, ...updatedRoutineData };
          // Recalculate nextDue if frequency changed optimistically
          if (updatedRoutineData.frequency) {
            updated.nextDue = calculateNextDueDate(
              new Date(),
              updatedRoutineData.frequency
            );
          }
          // Optimistic checklist update (if provided) - ensure items have basic structure
          if (updatedRoutineData.checklist) {
            updated.checklist = updatedRoutineData.checklist.map((item) => ({
              id: item.id || Math.random().toString(36).substring(7), // Keep existing ID or generate temp one
              text: item.text || "",
              completed: !!item.completed,
              level: item.level || 0,
              children: item.children || [],
            }));
          }
          return updated;
        }
        return r;
      }),
    }));

    try {
      // --- TODO: Replace with actual API call ---
      console.log(
        `TODO: Call API to update routine ${routineId} with`,
        updatedRoutineData
      );
      // await updateRoutineAPI(routineId, updatedRoutineData);
      await new Promise((resolve) => setTimeout(resolve, 300));
      set({ error: null });
      console.log("Simulated routine update successful");
      // --- End TODO ---
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
    })); // Optimistic

    try {
      // --- TODO: Replace with actual API call ---
      console.log(`TODO: Call API to delete routine ${routineId}`);
      // await deleteRoutineAPI(routineId);
      await new Promise((resolve) => setTimeout(resolve, 300));
      set({ error: null });
      console.log("Simulated routine delete successful");
      // --- End TODO ---
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
  // These might require more complex API endpoints or could be batched with routine updates

  toggleChecklistItem: async (routineId, itemId) => {
    const originalRoutines = get().routines;
    let resultData: any = {}; // To store optimistic results

    // Optimistic update
    set((state) => ({
      routines: state.routines.map((routine) => {
        if (routine.id === routineId) {
          let itemCompleted = false;
          let routineCompleted = routine.completed;
          let auraChange = 0;
          let nextDue = routine.nextDue;
          let lastCompleted = routine.lastCompleted;

          const updatedChecklist = routine.checklist.map((item) => {
            if (item.id === itemId) {
              itemCompleted = !item.completed;
              auraChange = itemCompleted ? 5 : -5; // Example item aura
              return { ...item, completed: itemCompleted };
            }
            return item;
          });

          const allItemsCompleted = updatedChecklist.every(
            (item) => item.completed
          );

          if (allItemsCompleted && !routine.completed) {
            routineCompleted = true;
            lastCompleted = new Date();
            nextDue = calculateNextDueDate(new Date(), routine.frequency);
            // auraChange += routine.auraValue; // Backend calculates routine completion aura
          } else if (!allItemsCompleted && routine.completed) {
            routineCompleted = false;
            lastCompleted = undefined;
            nextDue = calculateNextDueDate(new Date(), routine.frequency);
            // auraChange -= routine.auraValue; // Backend calculates routine completion aura loss
          }
          resultData = { itemCompleted, routineCompleted, auraChange, nextDue }; // Store optimistic results (auraChange is just item aura here)
          return {
            ...routine,
            checklist: updatedChecklist,
            completed: routineCompleted,
            nextDue,
            lastCompleted,
          };
        }
        return routine;
      }),
    }));

    try {
      // --- TODO: Replace with actual API call ---
      console.log(
        `TODO: Call API to toggle checklist item ${itemId} in routine ${routineId}`
      );
      // const apiResult = await toggleChecklistItemAPI(routineId, itemId);
      // Update store with confirmed state from API if necessary
      // return apiResult;
      await new Promise((resolve) => setTimeout(resolve, 300));
      console.log("Simulated checklist toggle successful");
      return resultData; // Return optimistic data on success
      // --- End TODO ---
    } catch (err) {
      console.error(`Failed to toggle checklist item ${itemId}:`, err);
      set({
        routines: originalRoutines,
        error: `Failed to toggle item: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
      return { error: err instanceof Error ? err.message : "Unknown error" };
    }
  },

  // Update, Delete, Indent, Outdent, Add, Reorder checklist items would follow similar patterns:
  // 1. Optimistic UI update (optional but recommended for responsiveness)
  // 2. API call
  // 3. Handle success (potentially update state with confirmed data from API)
  // 4. Handle error (rollback optimistic update, set error state)

  // Placeholder implementations for other checklist actions:
  updateChecklistItem: async (routineId, itemId, text) => {
    set((state) => ({
      routines: state.routines.map((r) =>
        r.id === routineId
          ? {
              ...r,
              checklist: r.checklist.map((i) =>
                i.id === itemId ? { ...i, text } : i
              ),
            }
          : r
      ),
    }));
    console.log(`TODO: API call to update item ${itemId} text`);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate
  },
  deleteChecklistItem: async (routineId, itemId) => {
    set((state) => ({
      routines: state.routines.map((r) =>
        r.id === routineId
          ? { ...r, checklist: r.checklist.filter((i) => i.id !== itemId) }
          : r
      ),
    }));
    console.log(`TODO: API call to delete item ${itemId}`);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate
  },
  indentChecklistItem: async (routineId, itemId) => {
    // Complex logic - requires finding previous item, checking levels. Keep local for now or implement complex API.
    set((state) => ({
      routines: state.routines.map((routine) => {
        if (routine.id === routineId) {
          const index = routine.checklist.findIndex(
            (item) => item.id === itemId
          );
          if (index > 0) {
            const updatedChecklist = [...routine.checklist];
            const prevLevel = updatedChecklist[index - 1].level;
            updatedChecklist[index] = {
              ...updatedChecklist[index],
              level: Math.min(updatedChecklist[index].level + 1, prevLevel + 1),
            };
            return { ...routine, checklist: updatedChecklist };
          }
        }
        return routine;
      }),
    }));
    console.log(`TODO: API call to indent item ${itemId}`);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate
  },
  outdentChecklistItem: async (routineId, itemId) => {
    // Keep local for now or implement complex API.
    set((state) => ({
      routines: state.routines.map((routine) => {
        if (routine.id === routineId) {
          const updatedChecklist = routine.checklist.map((item) =>
            item.id === itemId
              ? { ...item, level: Math.max(0, item.level - 1) }
              : item
          );
          return { ...routine, checklist: updatedChecklist };
        }
        return routine;
      }),
    }));
    console.log(`TODO: API call to outdent item ${itemId}`);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate
  },
  addChecklistItem: async (routineId, afterItemId, level) => {
    const newItem: ChecklistItemData = {
      id: Math.random().toString(36).substring(7),
      text: "",
      completed: false,
      level: level,
      children: [],
    };
    // Optimistic add
    set((state) => ({
      routines: state.routines.map((routine) => {
        if (routine.id === routineId) {
          const index = afterItemId
            ? routine.checklist.findIndex((item) => item.id === afterItemId)
            : -1;
          const newChecklist = [...routine.checklist];
          newChecklist.splice(index + 1, 0, newItem);
          return { ...routine, checklist: newChecklist };
        }
        return routine;
      }),
    }));
    console.log(
      `TODO: API call to add item after ${afterItemId} in routine ${routineId}`
    );
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate
    // TODO: API should return the created item with its real ID, update the store
    return newItem; // Return optimistically added item
  },
  reorderChecklist: async (routineId, newChecklistOrder) => {
    // Optimistic update
    set((state) => ({
      routines: state.routines.map((r) =>
        r.id === routineId ? { ...r, checklist: newChecklistOrder } : r
      ),
    }));
    console.log(`TODO: API call to reorder checklist for routine ${routineId}`);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate
  },
});

// Create the store WITHOUT persist
const useRoutineStore = create(routineStoreCreator);

export default useRoutineStore;
