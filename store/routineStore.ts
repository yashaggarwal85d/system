import { create, StateCreator } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Routine } from "@/lib/utils/interfaces";
import {
  addEntityAPI,
  deleteEntityAPI,
  updateEntityAPI,
} from "@/lib/utils/apiUtils";
import { calculateNextDueDate, getAuraValue } from "@/lib/utils/commonUtils";

interface RoutineState {
  Routines: Routine[];
  lastSelectedDate: Date;
  isLoading: boolean;
  error: string | null;

  setRoutines: (Routines: Routine[]) => void;
  setLastSelectedDate: (date: Date) => void;
  addRoutine: (
    name: string,
    start_date: Date,
    occurence: "weeks" | "months" | "days",
    x_occurence: number,
    repeat: number,
    checklist: string
  ) => void;
  updateRoutine: (id: string, Routine: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
}

type PersistedRoutineState = {
  Routines: Routine[];
  lastSelectedDate: Date;
};

const RoutineStoreCreator: StateCreator<RoutineState> = (set, get) => ({
  Routines: [],
  lastSelectedDate: new Date(),
  isLoading: false,
  error: null,

  setRoutines: (Routines) => set({ Routines, isLoading: false, error: null }),
  setLastSelectedDate: (date) => set({ lastSelectedDate: date }),

  addRoutine: async (
    name,
    start_date,
    occurence,
    x_occurence,
    repeat,
    checklist
  ) => {
    set({ isLoading: true });
    try {
      const RoutinePayload: Routine = {
        id: null,
        name: name,
        start_date: start_date,
        occurence: occurence,
        x_occurence: x_occurence,
        repeat: repeat,
        checklist: checklist,
        next_due_date: calculateNextDueDate(
          start_date,
          occurence,
          x_occurence,
          repeat
        ),
        aura: getAuraValue("routine", {
          checklist: checklist,
        }),
      };
      const addedRoutine = await addEntityAPI<Routine>(
        "Routine",
        RoutinePayload
      );
      set((currentState) => ({
        Routines: [addedRoutine, ...currentState.Routines],
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      console.error("Failed to add Routine:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: `Failed to add Routine: ${errorMsg}`, isLoading: false });
    }
  },
  updateRoutine: async (id, Routine) => {
    try {
      const updatedRoutine = await updateEntityAPI("Routine", id, Routine);
      set((state) => ({
        Routines: state.Routines.map((t) =>
          t.id === id
            ? {
                ...t,
                ...updatedRoutine,
              }
            : t
        ),
      }));
    } catch (err) {
      console.error("Failed to update Routine:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: `Failed to update Routine: ${errorMsg}`, isLoading: false });
    }
  },

  deleteRoutine: async (id) => {
    try {
      await deleteEntityAPI("Routine", id);
      set((state) => ({
        Routines: state.Routines.filter((Routine) => Routine.id !== id),
        error: null,
      }));
    } catch (err) {
      console.error("Failed to update Routine:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: `Failed to update Routine: ${errorMsg}`, isLoading: false });
    }
  },
});

// Create the store WITH persist middleware applied correctly
const useRoutineStore = create<RoutineState>()(
  persist(RoutineStoreCreator, {
    name: "Routine-storage",
    storage: createJSONStorage(() => localStorage),
    partialize: (state): PersistedRoutineState => ({
      Routines: state.Routines,
      lastSelectedDate: state.lastSelectedDate,
    }),
    onRehydrateStorage: () => {
      console.log("Attempting hydration for Routines...");
      return (state, error) => {
        if (error) {
          console.error("Failed to hydrate Routines:", error);
          return;
        }
        if (state) {
          state.Routines = state.Routines.map((t: any) => ({
            // Use any temporarily
            ...t,
            category: "Routine", // Ensure category is correct on rehydration
            createdAt: new Date(t.createdAt),
            updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
            deadline: t.deadline ? new Date(t.deadline) : undefined,
            lastCompleted: t.lastCompleted
              ? new Date(t.lastCompleted)
              : undefined,
            nextDue: t.nextDue ? new Date(t.nextDue) : undefined,
          }));
          state.lastSelectedDate = new Date(state.lastSelectedDate);
          state.isLoading = false;
          state.error = null;
          console.log("Routine hydration successful.");
        } else {
          console.log("No persisted Routine state found.");
        }
      };
    },
    version: 1,
  })
);

export default useRoutineStore;
