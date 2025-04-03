import { create, StateCreator } from "zustand";
import { persist, createJSONStorage, PersistOptions } from "zustand/middleware";
import { Task } from "@/lib/interfaces/task";
import { HabitConfig } from "@/lib/interfaces/habit";
import { calculateNextDueDate } from "@/lib/utils";
// Import the actual API functions
import {
  fetchHabitsAPI,
  addHabitAPI,
  updateHabitAPI,
  deleteHabitAPI,
  toggleHabitAPI,
} from "@/lib/apiClient";

interface HabitState {
  habits: Task[];
  isLoading: boolean;
  error: string | null;
  fetchHabits: () => Promise<void>;
  addHabit: (title: string, config: HabitConfig) => Promise<Task | null>;
  toggleHabit: (taskId: string) => Promise<{
    completed?: boolean;
    auraChange?: number;
    nextDue?: Date | null;
    error?: string;
  }>;
  updateHabit: (
    taskId: string,
    newTitle: string,
    newConfig?: HabitConfig
  ) => Promise<void>;
  deleteHabit: (taskId: string) => Promise<void>;
}

type PersistedHabitState = {
  habits: Task[];
};

const habitStoreCreator: StateCreator<HabitState> = (set, get) => ({
  habits: [],
  isLoading: false,
  error: null,

  fetchHabits: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const fetchedHabits = await fetchHabitsAPI();
      // Convert dates
      const habitsWithDates = fetchedHabits.map((h: any) => ({
        ...h,
        category: "habit" as const, // Ensure correct literal type
        createdAt: new Date(h.createdAt),
        updatedAt: new Date(h.updatedAt),
        deadline: h.deadline ? new Date(h.deadline) : undefined,
        lastCompleted: h.lastCompleted ? new Date(h.lastCompleted) : undefined,
        nextDue: h.nextDue ? new Date(h.nextDue) : undefined,
      }));
      set({ habits: habitsWithDates, isLoading: false, error: null });
    } catch (err) {
      console.error("Failed to fetch habits:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      set({
        error: `Failed to load habits: ${errorMsg}`,
        isLoading: false,
        habits: [],
      });
    }
  },

  addHabit: async (title, config) => {
    set({ isLoading: true });
    try {
      const habitPayload = { title, frequency: config };
      const addedHabit = await addHabitAPI(habitPayload); // Call API

      // Convert dates and ensure type
      const habitWithDates: Task = {
        ...addedHabit,
        category: "habit",
        createdAt: new Date(addedHabit.createdAt),
        updatedAt: new Date(addedHabit.updatedAt),
        deadline: addedHabit.deadline
          ? new Date(addedHabit.deadline)
          : undefined,
        isHabit: true, // Ensure this is set
        frequency: addedHabit.frequency as HabitConfig, // Cast if necessary
        isGoodHabit: addedHabit.isGoodHabit ?? undefined, // Map null/undefined from API to undefined
        lastCompleted: addedHabit.lastCompleted
          ? new Date(addedHabit.lastCompleted)
          : undefined,
        nextDue: addedHabit.nextDue ? new Date(addedHabit.nextDue) : undefined,
        originalTime: addedHabit.originalTime ?? undefined, // Map null/undefined from API to undefined
        userId: addedHabit.userId || "unknown",
      };

      set((state) => ({
        habits: [habitWithDates, ...state.habits],
        isLoading: false,
        error: null,
      }));
      return habitWithDates;
    } catch (err) {
      console.error("Failed to add habit:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: `Failed to add habit: ${errorMsg}`, isLoading: false });
      return null;
    }
  },

  toggleHabit: async (taskId) => {
    const originalHabits = get().habits;
    let optimisticCompleted: boolean | undefined;
    let optimisticNextDue: Date | undefined | null;
    let optimisticLastCompleted: Date | undefined | null;

    // Optimistic update
    set((state) => ({
      habits: state.habits.map((task) => {
        if (task.id === taskId && task.frequency) {
          optimisticCompleted = !task.completed;
          if (optimisticCompleted) {
            optimisticLastCompleted = new Date();
            optimisticNextDue = calculateNextDueDate(
              new Date(),
              task.frequency
            );
          } else {
            optimisticLastCompleted = undefined; // Use undefined to match interface
            // Recalculate next due based on 'now' as if it wasn't completed
            optimisticNextDue = calculateNextDueDate(
              new Date(),
              task.frequency
            );
          }
          return {
            ...task,
            completed: optimisticCompleted,
            nextDue: optimisticNextDue,
            lastCompleted: optimisticLastCompleted,
          };
        }
        return task;
      }),
      error: null,
    }));

    try {
      const result = await toggleHabitAPI(taskId); // Call API
      // Update state with confirmed data from API
      set((state) => ({
        habits: state.habits.map((h) =>
          h.id === taskId
            ? {
                ...h,
                completed: result.completed,
                nextDue: result.nextDue ?? undefined, // Convert null to undefined
                lastCompleted: result.completed ? new Date() : undefined, // Use undefined
              } // Use API's nextDue, update lastCompleted based on final completed status
            : h
        ),
      }));
      return {
        completed: result.completed,
        auraChange: result.auraChange,
        nextDue: result.nextDue,
      };
    } catch (err) {
      console.error(`Failed to toggle habit ${taskId}:`, err);
      set({
        habits: originalHabits,
        error: `Failed to toggle habit: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
      return { error: err instanceof Error ? err.message : "Unknown error" };
    }
  },

  updateHabit: async (taskId, newTitle, newConfig) => {
    const originalHabits = get().habits;
    // Optimistic update
    set((state) => ({
      habits: state.habits.map((h) => {
        if (h.id === taskId) {
          const updated = { ...h, title: newTitle };
          if (newConfig) {
            updated.frequency = newConfig;
            updated.isGoodHabit = newConfig.isGoodHabit;
            updated.originalTime = newConfig.time;
            updated.nextDue = calculateNextDueDate(new Date(), newConfig); // Optimistic nextDue recalc
          }
          return updated;
        }
        return h;
      }),
      error: null,
    }));

    try {
      const payload = {
        title: newTitle,
        ...(newConfig && { frequency: newConfig }),
      };
      const updatedHabit = await updateHabitAPI(taskId, payload); // Call API

      // Update state with confirmed data from API
      const habitWithDates: Task = {
        ...updatedHabit,
        category: "habit",
        createdAt: new Date(updatedHabit.createdAt),
        updatedAt: new Date(updatedHabit.updatedAt),
        deadline: updatedHabit.deadline
          ? new Date(updatedHabit.deadline)
          : undefined,
        isHabit: true,
        frequency: updatedHabit.frequency as HabitConfig,
        isGoodHabit: updatedHabit.isGoodHabit ?? undefined, // Map null to undefined
        lastCompleted: updatedHabit.lastCompleted
          ? new Date(updatedHabit.lastCompleted)
          : undefined,
        nextDue: updatedHabit.nextDue
          ? new Date(updatedHabit.nextDue)
          : undefined,
        originalTime: updatedHabit.originalTime ?? undefined, // Map null to undefined
        userId: updatedHabit.userId || "unknown",
      };

      set((state) => ({
        habits: state.habits.map((h) => (h.id === taskId ? habitWithDates : h)),
        error: null,
      }));
    } catch (err) {
      console.error(`Failed to update habit ${taskId}:`, err);
      set({
        habits: originalHabits,
        error: `Failed to update habit: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
    }
  },

  deleteHabit: async (taskId) => {
    const originalHabits = get().habits;
    set((state) => ({
      habits: state.habits.filter((task) => task.id !== taskId),
      error: null,
    })); // Optimistic

    try {
      await deleteHabitAPI(taskId); // Call API
      set({ error: null });
    } catch (err) {
      console.error(`Failed to delete habit ${taskId}:`, err);
      set({
        habits: originalHabits,
        error: `Failed to delete habit: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
    }
  },
});

// Create the store WITH persist middleware applied correctly
const useHabitStore = create<HabitState>()(
  persist(habitStoreCreator, {
    name: "habit-storage",
    storage: createJSONStorage(() => localStorage),
    partialize: (state): PersistedHabitState => ({
      habits: state.habits,
    }),
    onRehydrateStorage: () => {
      console.log("Attempting hydration for habits...");
      return (state, error) => {
        if (error) {
          console.error("Failed to hydrate habits:", error);
          return;
        }
        if (state) {
          state.habits = state.habits.map((h: any) => ({
            ...h,
            category: "habit", // Ensure correct category
            createdAt: new Date(h.createdAt),
            updatedAt: h.updatedAt ? new Date(h.updatedAt) : new Date(),
            deadline: h.deadline ? new Date(h.deadline) : undefined,
            lastCompleted: h.lastCompleted
              ? new Date(h.lastCompleted)
              : undefined,
            nextDue: h.nextDue ? new Date(h.nextDue) : undefined,
          }));
          state.isLoading = false;
          state.error = null;
          console.log("Habit hydration successful.");
        } else {
          console.log("No persisted habit state found.");
        }
      };
    },
    version: 1,
  })
);

export default useHabitStore;
