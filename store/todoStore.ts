import { create, StateCreator } from "zustand";
// Remove persist imports: import { persist, createJSONStorage, PersistOptions } from "zustand/middleware";
import { Task } from "@/lib/interfaces/task";
import { getAuraValue } from "@/lib/utils";
// TODO: Import API functions: import { fetchTodosAPI, addTodoAPI, updateTodoAPI, deleteTodoAPI, toggleTodoAPI } from '@/lib/api';

interface TodoState {
  todos: Task[];
  lastSelectedDate: Date; // Keep track of the last date used for adding todos locally
  isLoading: boolean;
  error: string | null;

  setTodos: (todos: Task[]) => void; // Keep for direct setting if needed
  setLastSelectedDate: (date: Date) => void;
  fetchTodos: () => Promise<void>;
  addTodo: (
    // Component only needs to provide title and optional deadline
    title: string,
    deadline?: Date
  ) => Promise<Task | null>; // Return Task or null on error
  toggleTodo: (taskId: string) => Promise<{
    // Return type might change based on API response
    completed?: boolean;
    auraChange?: number;
    error?: string;
  }>;
  updateTodo: (
    taskId: string,
    newTitle: string,
    newDeadline?: Date | null // Allow null to clear deadline
  ) => Promise<void>;
  deleteTodo: (taskId: string) => Promise<void>;
}

const todoStoreCreator: StateCreator<TodoState> = (set, get) => ({
  todos: [],
  lastSelectedDate: new Date(), // Still useful for UI default date
  isLoading: true,
  error: null,

  setTodos: (todos) => set({ todos, isLoading: false, error: null }), // Simplified setter
  setLastSelectedDate: (date) => set({ lastSelectedDate: date }),

  fetchTodos: async () => {
    set({ isLoading: true, error: null });
    try {
      // --- TODO: Replace with actual API call ---
      console.log("TODO: Fetch todos from API");
      // const fetchedTodos = await fetchTodosAPI();
      // Ensure dates are converted
      // const todosWithDates = fetchedTodos.map(t => ({
      //   ...t,
      //   createdAt: new Date(t.createdAt),
      //   updatedAt: new Date(t.updatedAt),
      //   deadline: t.deadline ? new Date(t.deadline) : undefined,
      //   lastCompleted: t.lastCompleted ? new Date(t.lastCompleted) : undefined, // Add if relevant for todos
      //   nextDue: t.nextDue ? new Date(t.nextDue) : undefined, // Add if relevant for todos
      // }));
      // set({ todos: todosWithDates, isLoading: false });
      set({ todos: [], isLoading: false }); // Simulate empty fetch
      // --- End TODO ---
    } catch (err) {
      console.error("Failed to fetch todos:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      set({
        error: `Failed to load todos: ${errorMsg}`,
        isLoading: false,
        todos: [],
      });
    }
  },

  addTodo: async (title, deadline) => {
    set({ isLoading: true }); // Indicate loading
    const state = get();
    try {
      const todoPayload = {
        title: title,
        category: "todo",
        // Removed auraValue
        deadline: deadline || state.lastSelectedDate || new Date(), // Use local state for default deadline suggestion
        // completed, createdAt, updatedAt, userId set by backend
      };

      // --- TODO: Replace with actual API call ---
      console.log("TODO: Call API to add todo:", todoPayload);
      // const addedTodo = await addTodoAPI(todoPayload);
      // Ensure dates converted
      // const todoWithDates = {
      //    ...addedTodo,
      //    createdAt: new Date(addedTodo.createdAt),
      //    updatedAt: new Date(addedTodo.updatedAt),
      //    deadline: addedTodo.deadline ? new Date(addedTodo.deadline) : undefined,
      // }
      // set((state) => ({ todos: [todoWithDates, ...state.todos], isLoading: false, error: null }));
      // return todoWithDates;

      // Simulate API response
      const simulatedAddedTodo: Task = {
        ...todoPayload,
        id: Math.random().toString(36).substring(7),
        completed: false,
        category: "todo", // Explicitly set category
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "temp-user-id", // Placeholder
      };
      set((state) => ({
        todos: [simulatedAddedTodo, ...state.todos],
        isLoading: false,
        error: null,
      }));
      return simulatedAddedTodo;
      // --- End TODO ---
    } catch (err) {
      console.error("Failed to add todo:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: `Failed to add todo: ${errorMsg}`, isLoading: false });
      return null;
    }
  },

  toggleTodo: async (taskId) => {
    const originalTodos = get().todos;
    let optimisticCompleted: boolean | undefined;

    // Optimistic update
    set((state) => ({
      todos: state.todos.map((task) => {
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
      console.log(`TODO: Call API to toggle todo ${taskId}`);
      // const result = await toggleTodoAPI(taskId); // API returns { completed, auraChange }
      // set((state) => ({ // Update completion state based on response if needed, though optimistic should match
      //    todos: state.todos.map(t => t.id === taskId ? {...t, completed: result.completed} : t)
      // }));
      // return { completed: result.completed, auraChange: result.auraChange };

      // Simulate API response
      await new Promise((resolve) => setTimeout(resolve, 300));
      const toggledTodo = originalTodos.find((t) => t.id === taskId);
      if (!toggledTodo) throw new Error("Todo not found for simulation");
      // Simulate aura change calculation (backend would do this)
      const simulatedAuraChange = optimisticCompleted ? 10 : -10; // Example value
      const auraChange = simulatedAuraChange;
      console.log("Simulated todo toggle successful");
      return { completed: optimisticCompleted, auraChange: auraChange };
      // --- End TODO ---
    } catch (err) {
      console.error(`Failed to toggle todo ${taskId}:`, err);
      // Rollback
      set({
        todos: originalTodos,
        error: `Failed to toggle todo: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
      return { error: err instanceof Error ? err.message : "Unknown error" };
    }
  },

  updateTodo: async (taskId, newTitle, newDeadline) => {
    const originalTodos = get().todos;
    // Optimistic update
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === taskId
          ? {
              ...t,
              title: newTitle,
              deadline:
                newDeadline === null ? undefined : newDeadline ?? t.deadline,
            }
          : t
      ),
    }));

    try {
      // --- TODO: Replace with actual API call ---
      const payload = { title: newTitle, deadline: newDeadline }; // Send null to clear deadline
      console.log(`TODO: Call API to update todo ${taskId} with`, payload);
      // await updateTodoAPI(taskId, payload);
      await new Promise((resolve) => setTimeout(resolve, 300));
      set({ error: null });
      console.log("Simulated todo update successful");
      // --- End TODO ---
    } catch (err) {
      console.error(`Failed to update todo ${taskId}:`, err);
      // Rollback
      set({
        todos: originalTodos,
        error: `Failed to update todo: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
    }
  },

  deleteTodo: async (taskId) => {
    const originalTodos = get().todos;
    // Optimistic update
    set((state) => ({
      todos: state.todos.filter((task) => task.id !== taskId),
    }));

    try {
      // --- TODO: Replace with actual API call ---
      console.log(`TODO: Call API to delete todo ${taskId}`);
      // await deleteTodoAPI(taskId);
      await new Promise((resolve) => setTimeout(resolve, 300));
      set({ error: null });
      console.log("Simulated todo delete successful");
      // --- End TODO ---
    } catch (err) {
      console.error(`Failed to delete todo ${taskId}:`, err);
      // Rollback
      set({
        todos: originalTodos,
        error: `Failed to delete todo: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
    }
  },
});

// Create the store WITHOUT persist
const useTodoStore = create(todoStoreCreator);

export default useTodoStore;
