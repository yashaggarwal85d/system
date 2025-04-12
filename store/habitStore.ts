import { create, StateCreator } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Habit } from "@/lib/utils/interfaces";
import {
  addEntityAPI,
  deleteEntityAPI,
  updateEntityAPI,
} from "@/lib/utils/apiUtils";
import {
  calculateNextDueDate,
  formatDateToDDMMYY,
  getAuraValue,
} from "@/lib/utils/commonUtils";
import useDashboardStore from "./dashboardStore";

interface HabitState {
  Habits: Habit[];
  isLoading: boolean;
  error: string | null;

  setHabits: (Habits: Habit[]) => void;
  setError: (error: string | null) => void;
  addHabit: (
    name: string,
    occurence: "weeks" | "months" | "days",
    x_occurence: number,
    isGoodHabit: boolean
  ) => void;
  updateHabit: (id: string, Habit: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
}

type PersistedHabitState = {
  Habits: Habit[];
};

const HabitStoreCreator: StateCreator<HabitState> = (set, get) => ({
  Habits: [],
  isLoading: false,
  error: null,

  setError: (error) => set({ error, isLoading: false }),
  setHabits: (Habits) => set({ Habits, isLoading: false, error: null }),

  addHabit: async (name, occurence, x_occurence, isGoodHabit) => {
    set({ isLoading: true });
    const player = useDashboardStore.getState().player;
    try {
      let aura = getAuraValue("habit");
      const HabitPayload = {
        name: name,
        start_date: formatDateToDDMMYY(new Date()),
        occurence: occurence,
        x_occurence: x_occurence,
        aura: isGoodHabit ? aura : -aura,
        userId: player?.username,
        last_completed: formatDateToDDMMYY(new Date()),
      };
      const addedHabit = await addEntityAPI<Habit>("habits", HabitPayload);
      set((currentState) => ({
        Habits: [addedHabit, ...currentState.Habits],
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      console.error("Failed to add Habit:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: `Failed to add Habit: ${errorMsg}`, isLoading: false });
    }
  },
  updateHabit: async (id, Habit) => {
    try {
      const updatedHabit = await updateEntityAPI("habits", id, Habit);
      set((state) => ({
        Habits: state.Habits.map((t) =>
          t.id === id
            ? {
                ...t,
                ...updatedHabit,
              }
            : t
        ),
      }));
    } catch (err) {
      console.error("Failed to update Habit:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: `Failed to update Habit: ${errorMsg}`, isLoading: false });
    }
  },

  deleteHabit: async (id) => {
    try {
      await deleteEntityAPI("habits", id);
      set((state) => ({
        Habits: state.Habits.filter((Habit) => Habit.id !== id),
        error: null,
      }));
    } catch (err) {
      console.error("Failed to update Habit:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: `Failed to update Habit: ${errorMsg}`, isLoading: false });
    }
  },
});

const useHabitStore = create<HabitState>()(
  persist(HabitStoreCreator, {
    name: "Habit-storage",
    storage: createJSONStorage(() => localStorage),
    partialize: (state): PersistedHabitState => ({
      Habits: state.Habits,
    }),
    onRehydrateStorage: () => {
      console.log("Attempting hydration for Habits...");
      return (state, error) => {
        if (error) {
          console.error("Failed to hydrate Habits:", error);
          return;
        }
        if (state) {
          state.Habits = state.Habits.map((t: any) => ({
            ...t,
          }));
          state.isLoading = false;
          state.error = null;
          console.log("Habit hydration successful.");
        } else {
          console.log("No persisted Habit state found.");
        }
      };
    },
    version: 1,
  })
);

export default useHabitStore;
