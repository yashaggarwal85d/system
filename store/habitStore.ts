import { create, StateCreator } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Habit } from "@/lib/utils/interfaces";
import {
  addEntityAPI,
  deleteEntityAPI,
  updateEntityAPI,
} from "@/lib/utils/apiUtils";
import { calculateNextDueDate, getAuraValue } from "@/lib/utils/commonUtils";

interface HabitState {
  Habits: Habit[];
  lastSelectedDate: Date;
  isLoading: boolean;
  error: string | null;

  setHabits: (Habits: Habit[]) => void;
  setLastSelectedDate: (date: Date) => void;
  addHabit: (
    name: string,
    start_date: Date,
    occurence: "weeks" | "months" | "days",
    x_occurence: number,
    repeat: number
  ) => void;
  updateHabit: (id: string, Habit: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
}

type PersistedHabitState = {
  Habits: Habit[];
  lastSelectedDate: Date;
};

const HabitStoreCreator: StateCreator<HabitState> = (set, get) => ({
  Habits: [],
  lastSelectedDate: new Date(),
  isLoading: false,
  error: null,

  setHabits: (Habits) => set({ Habits, isLoading: false, error: null }),
  setLastSelectedDate: (date) => set({ lastSelectedDate: date }),

  addHabit: async (name, start_date, occurence, x_occurence, repeat) => {
    set({ isLoading: true });
    try {
      const HabitPayload: Habit = {
        id: null,
        name: name,
        start_date: start_date,
        occurence: occurence,
        x_occurence: x_occurence,
        repeat: repeat,
        next_due_date: calculateNextDueDate(
          start_date,
          occurence,
          x_occurence,
          repeat
        ),
        aura: getAuraValue("habit", {
          occurence: occurence,
          x_occurence: x_occurence,
          repeat: repeat,
        }),
      };
      const addedHabit = await addEntityAPI<Habit>("Habit", HabitPayload);
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
      const updatedHabit = await updateEntityAPI("Habit", id, Habit);
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
      await deleteEntityAPI("Habit", id);
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

// Create the store WITH persist middleware applied correctly
const useHabitStore = create<HabitState>()(
  persist(HabitStoreCreator, {
    name: "Habit-storage",
    storage: createJSONStorage(() => localStorage),
    partialize: (state): PersistedHabitState => ({
      Habits: state.Habits,
      lastSelectedDate: state.lastSelectedDate,
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
            // Use any temporarily
            ...t,
            category: "Habit", // Ensure category is correct on rehydration
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
