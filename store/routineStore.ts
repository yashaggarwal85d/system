import { create, StateCreator } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Routine, ChecklistItemData } from "@/lib/utils/interfaces";
import {
  addEntityAPI,
  deleteEntityAPI,
  updateEntityAPI,
} from "@/lib/utils/apiUtils";
import {
  checklistToString,
  formatDateToDDMMYY,
  getAuraValue,
  stringToChecklist,
} from "@/lib/utils/commonUtils";
import useDashboardStore from "./dashboardStore";

interface RoutineState {
  Routines: Routine[];
  isLoading: boolean;
  error: string | null;

  setRoutines: (Routines: Routine[]) => void;
  setError: (error: string | null) => void;
  addRoutine: (
    name: string,
    occurence: "weeks" | "months" | "days",
    x_occurence: number,
    isGoodRoutine: boolean,
    checklist?: ChecklistItemData[]
  ) => void;
  updateRoutine: (id: string, Routine: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
}

type PersistedRoutineState = {
  Routines: Routine[];
};

const RoutineStoreCreator: StateCreator<RoutineState> = (set, get) => ({
  Routines: [],
  isLoading: false,
  error: null,

  setError: (error) => set({ error, isLoading: false }),
  setRoutines: (Routines) => {
    const routines = Routines.map((routine) => ({
      ...routine,
      checklist: stringToChecklist(routine.checklist.toString()),
    }));
    set({ Routines: routines, isLoading: false });
  },
  addRoutine: async (
    name,
    occurence,
    x_occurence,
    isGoodRoutine,
    checklist = []
  ) => {
    set({ isLoading: true });
    const player = useDashboardStore.getState().player;
    try {
      let aura = getAuraValue("routine", {
        occurence: occurence,
        x_occurence: x_occurence,
      });
      const RoutinePayload = {
        name: name,
        start_date: formatDateToDDMMYY(new Date()),
        occurence: occurence,
        x_occurence: x_occurence,
        aura: isGoodRoutine ? aura : -aura,
        userId: player?.username,
        last_completed: formatDateToDDMMYY(new Date()),
        checklist: checklistToString(checklist),
      };
      var addedRoutine = await addEntityAPI("routines", RoutinePayload);
      var routineAdded = {
        ...addedRoutine,
        checklist: stringToChecklist(addedRoutine.checklist),
      };
      set((currentState) => ({
        Routines: [routineAdded, ...currentState.Routines],
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
      var updatedRoutine: any;
      if (Routine.checklist) {
        updatedRoutine = await updateEntityAPI("routines", id, {
          ...Routine,
          checklist: checklistToString(Routine.checklist),
        });
      } else {
        updatedRoutine = await updateEntityAPI("routines", id, Routine);
      }
      updatedRoutine.checklist = stringToChecklist(updatedRoutine.checklist);

      set((state) => ({
        Routines: state.Routines.map((r) =>
          r.id === id
            ? {
                ...r,
                ...updatedRoutine,
              }
            : r
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
      await deleteEntityAPI("routines", id);
      set((state) => ({
        Routines: state.Routines.filter((Routine) => Routine.id !== id),
        error: null,
      }));
    } catch (err) {
      console.error("Failed to delete Routine:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: `Failed to delete Routine: ${errorMsg}`, isLoading: false });
    }
  },
});

const useRoutineStore = create<RoutineState>()(
  persist(RoutineStoreCreator, {
    name: "Routine-storage",
    storage: createJSONStorage(() => localStorage),
    partialize: (state): PersistedRoutineState => ({
      Routines: state.Routines,
    }),
    onRehydrateStorage: () => {
      console.log("Attempting hydration for Routines...");
      return (state, error) => {
        if (error) {
          console.error("Failed to hydrate Routines:", error);
          return;
        }
        if (state) {
          state.Routines = state.Routines.map((r: any) => ({
            ...r,
            checklist: Array.isArray(r.checklist) ? r.checklist : [],
          }));
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
