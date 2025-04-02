import { create, StateCreator } from "zustand";
import { Task } from "@/lib/interfaces/task";
import { HabitConfig } from "@/lib/interfaces/habit";
import { calculateNextDueDate, getAuraValue } from "@/lib/utils";
// TODO: Import API functions when created: import { fetchHabitsAPI, addHabitAPI, updateHabitAPI, deleteHabitAPI, toggleHabitAPI } from '@/lib/api';

interface HabitState {
  habits: Task[];
  isLoading: boolean;
  error: string | null;
  fetchHabits: () => Promise<void>;
  addHabit: (
    newTaskData: Omit<
      Task,
      | "id"
      | "category"
      | "createdAt"
      | "updatedAt"
      // | "auraValue" // Removed
      | "isHabit"
      | "nextDue"
      | "completed"
      | "userId"
    >,
    title: string,
    config: HabitConfig
  ) => Promise<Task | null>;
  toggleHabit: (taskId: string) => Promise<{
    completed?: boolean;
    auraChange?: number; // API should return this based on calculation
    nextDue?: Date;
    error?: string;
  }>;
  updateHabit: (
    taskId: string,
    newTitle: string,
    newConfig?: HabitConfig
  ) => Promise<void>;
  deleteHabit: (taskId: string) => Promise<void>;
}

const habitStoreCreator: StateCreator<HabitState> = (set, get) => ({
  habits: [],
  isLoading: true,
  error: null,

  fetchHabits: async () => {
    set({ isLoading: true, error: null });
    try {
      // --- TODO: Replace with actual API call ---
      console.log("TODO: Fetch habits from API");
      // const fetchedHabits = await fetchHabitsAPI();
      // Convert dates...
      // set({ habits: habitsWithDates, isLoading: false });
      set({ habits: [], isLoading: false }); // Simulate empty fetch
      // --- End TODO ---
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

  addHabit: async (newTaskData, title, config) => {
    set({ isLoading: true });
    try {
      const now = new Date();
      const [hours, minutes] = config.time.split(":").map(Number);
      let nextDue = new Date(now);
      nextDue.setHours(hours, minutes, 0, 0);
      if (nextDue.getTime() < now.getTime()) {
        const initialNextDue = calculateNextDueDate(now, config);
        if (initialNextDue) nextDue.setTime(initialNextDue.getTime());
        else nextDue.setDate(nextDue.getDate() + 1);
      }

      const habitPayload = {
        ...newTaskData,
        title: title,
        category: "habit",
        // auraValue removed
        isHabit: true,
        frequency: config,
        isGoodHabit: config.isGoodHabit,
        originalTime: config.time,
        nextDue: nextDue,
      };

      // --- TODO: Replace with actual API call ---
      console.log("TODO: Call API to add habit:", habitPayload);
      // const addedHabit = await addHabitAPI(habitPayload);
      // Convert dates...
      // set((state) => ({ habits: [habitWithDates, ...state.habits], isLoading: false, error: null }));
      // return habitWithDates;

      // Simulate API response
      const simulatedAddedHabit: Task = {
        ...habitPayload,
        id: Math.random().toString(36).substring(7),
        completed: false,
        category: "habit",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "temp-user-id",
        lastCompleted: undefined,
      };
      set((state) => ({
        habits: [simulatedAddedHabit, ...state.habits],
        isLoading: false,
        error: null,
      }));
      return simulatedAddedHabit;
      // --- End TODO ---
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
    set((state) => ({
      habits: state.habits.map((task) => {
        if (task.id === taskId) {
          optimisticCompleted = !task.completed;
          return { ...task, completed: optimisticCompleted };
        }
        return task;
      }),
      error: null,
    }));

    try {
      // --- TODO: Replace with actual API call ---
      console.log(`TODO: Call API to toggle habit ${taskId}`);
      // const result = await toggleHabitAPI(taskId); // API returns { completed, auraChange, nextDue }
      // Convert dates...
      // set((state) => ({ habits: state.habits.map(h => h.id === taskId ? {...h, ...result.updatedHabit} : h) })); // Update with confirmed state
      // return { completed: result.completed, auraChange: result.auraChange, nextDue: result.nextDue ? new Date(result.nextDue) : undefined };

      // Simulate API response
      await new Promise((resolve) => setTimeout(resolve, 300));
      const toggledHabit = originalHabits.find((h) => h.id === taskId);
      if (!toggledHabit) throw new Error("Habit not found for simulation");

      const isGood = toggledHabit.isGoodHabit ?? false;
      // Simulate aura change calculation (backend would do this based on player level etc.)
      const simulatedAuraChange = optimisticCompleted
        ? isGood
          ? 15
          : -15 // Example values
        : isGood
        ? -15
        : 15;
      const nextDue = calculateNextDueDate(new Date(), toggledHabit.frequency);

      // Update store with simulated final state
      set((state) => ({
        habits: state.habits.map((h) =>
          h.id === taskId
            ? {
                ...h,
                completed: optimisticCompleted!,
                nextDue: nextDue,
                lastCompleted: optimisticCompleted ? new Date() : undefined,
              }
            : h
        ),
      }));

      return {
        completed: optimisticCompleted,
        auraChange: simulatedAuraChange,
        nextDue: nextDue,
      };
      // --- End TODO ---
    } catch (err) {
      console.error(`Failed to toggle habit ${taskId}:`, err);
      set({
        habits: originalHabits, // Rollback
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
            updated.nextDue = calculateNextDueDate(new Date(), newConfig);
          }
          return updated;
        }
        return h;
      }),
    }));

    try {
      // --- TODO: Replace with actual API call ---
      const payload = {
        title: newTitle,
        ...(newConfig && {
          frequency: newConfig,
          isGoodHabit: newConfig.isGoodHabit,
          originalTime: newConfig.time,
        }),
      };
      console.log(`TODO: Call API to update habit ${taskId} with`, payload);
      // await updateHabitAPI(taskId, payload);
      await new Promise((resolve) => setTimeout(resolve, 300));
      set({ error: null });
      console.log("Simulated habit update successful");
      // --- End TODO ---
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
    })); // Optimistic

    try {
      // --- TODO: Replace with actual API call ---
      console.log(`TODO: Call API to delete habit ${taskId}`);
      // await deleteHabitAPI(taskId);
      await new Promise((resolve) => setTimeout(resolve, 300));
      set({ error: null });
      console.log("Simulated habit delete successful");
      // --- End TODO ---
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

const useHabitStore = create(habitStoreCreator);

export default useHabitStore;
