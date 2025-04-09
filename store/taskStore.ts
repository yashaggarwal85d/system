import { create, StateCreator } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Task } from "@/lib/utils/interfaces";
import {
  addEntityAPI,
  deleteEntityAPI,
  updateEntityAPI,
} from "@/lib/utils/apiUtils";
import { getAuraValue } from "@/lib/utils/commonUtils";
import useDashboardStore from "./dashboardStore";

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;

  setError: (error: string | null) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (name: string, due_date: string) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
}

type PersistedTaskState = {
  tasks: Task[];
};

const taskStoreCreator: StateCreator<TaskState> = (set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  setError: (error) => set({ error, isLoading: false }),
  setTasks: (tasks) => set({ tasks, isLoading: false, error: null }),

  addTask: async (name, due_date) => {
    set({ isLoading: true });
    const player = useDashboardStore.getState().player;
    try {
      const taskPayloadToSend = {
        userId: player?.username,
        name: name,
        due_date: due_date,
        aura: getAuraValue("task", {
          name: name,
          due_date: due_date,
        }),
        completed: false,
      };

      const addedTask = await addEntityAPI<Task>("tasks", taskPayloadToSend);
      set((currentState) => ({
        tasks: [addedTask, ...currentState.tasks],
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      console.error("Failed to add task:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: `Failed to add task: ${errorMsg}`, isLoading: false });
    }
  },
  updateTask: async (id, task) => {
    try {
      const updatedTask = await updateEntityAPI<Task>("tasks", id, task);
      console.log(updatedTask);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                ...updatedTask,
              }
            : t
        ),
      }));
    } catch (err) {
      console.error("Failed to update task:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: `Failed to update task: ${errorMsg}`, isLoading: false });
    }
  },

  deleteTask: async (id) => {
    try {
      await deleteEntityAPI("tasks", id);
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
        error: null,
      }));
    } catch (err) {
      console.error("Failed to update task:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: `Failed to update task: ${errorMsg}`, isLoading: false });
    }
  },
});

const useTaskStore = create<TaskState>()(
  persist(taskStoreCreator, {
    name: "task-storage",
    storage: createJSONStorage(() => localStorage),
    partialize: (state): PersistedTaskState => ({
      tasks: state.tasks,
    }),
    onRehydrateStorage: () => {
      console.log("Attempting hydration for tasks...");
      return (state, error) => {
        if (error) {
          console.error("Failed to hydrate tasks:", error);
          return;
        }
        if (state) {
          state.tasks = state.tasks.map((t: any) => ({
            ...t,
            category: "tasks",
            due_date: t.due_date,
          }));
          state.isLoading = false;
          state.error = null;
          console.log("task hydration successful.");
        } else {
          console.log("No persisted task state found.");
        }
      };
    },
    version: 1,
  })
);

export default useTaskStore;
