import { create, StateCreator } from "zustand";
import { persist, createJSONStorage, PersistOptions } from "zustand/middleware";
import { Task } from "@/lib/interfaces/task"; // Use local interface for consistency if needed
// Import the actual API functions
import {
  fetchTodosAPI,
  addTodoAPI,
  updateTodoAPI,
  deleteTodoAPI,
  toggleTodoAPI,
} from "@/lib/apiClient";

interface TodoState {
  todos: Task[];
  lastSelectedDate: Date;
  isLoading: boolean;
  error: string | null;
  setTodos: (todos: Task[]) => void;
  setLastSelectedDate: (date: Date) => void;
  fetchTodos: () => Promise<void>;
  addTodo: (title: string, deadline?: Date) => Promise<Task | null>;
  toggleTodo: (
    taskId: string
  ) => Promise<{ completed?: boolean; auraChange?: number; error?: string }>;
  updateTodo: (
    taskId: string,
    newTitle: string,
    newDeadline?: Date | null
  ) => Promise<void>;
  deleteTodo: (taskId: string) => Promise<void>;
}

type PersistedTodoState = {
  todos: Task[];
  lastSelectedDate: Date;
};

const todoStoreCreator: StateCreator<TodoState> = (set, get) => ({
  todos: [],
  lastSelectedDate: new Date(),
  isLoading: false,
  error: null,

  setTodos: (todos) => set({ todos, isLoading: false, error: null }),
  setLastSelectedDate: (date) => set({ lastSelectedDate: date }),

  fetchTodos: async () => {
    // Check if already loading to prevent concurrent fetches
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const fetchedTodos = await fetchTodosAPI();
      // Ensure dates are converted correctly after fetching
      const todosWithDates = fetchedTodos.map((t: any) => ({
        // Use any temporarily if Prisma types mismatch interface
        ...t,
        // Ensure category is correctly typed if needed by Task interface
        category: "todo" as const, // Assuming Task interface requires literal type
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        deadline: t.deadline ? new Date(t.deadline) : undefined,
        lastCompleted: t.lastCompleted ? new Date(t.lastCompleted) : undefined,
        nextDue: t.nextDue ? new Date(t.nextDue) : undefined,
      }));
      set({ todos: todosWithDates, isLoading: false, error: null });
    } catch (err) {
      console.error("Failed to fetch todos:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      set({
        error: `Failed to load todos: ${errorMsg}`,
        isLoading: false,
        todos: [],
      }); // Clear todos on error
    }
  },

  addTodo: async (title, deadline) => {
    set({ isLoading: true }); // Indicate loading for this specific action
    const state = get();
    try {
      const todoPayload = {
        title: title,
        deadline: deadline, // Pass deadline directly (API handles default/null)
      };
      const addedTodo = await addTodoAPI(todoPayload); // Call API

      // Convert dates from API response and ensure type correctness
      const todoWithDates: Task = {
        ...addedTodo,
        category: "todo", // Explicitly set category to match Task interface
        createdAt: new Date(addedTodo.createdAt),
        updatedAt: new Date(addedTodo.updatedAt),
        deadline: addedTodo.deadline ? new Date(addedTodo.deadline) : undefined,
        // Ensure all other potential date/optional fields from Task interface are handled
        isHabit: false, // Explicitly set for Task interface if needed
        frequency: undefined,
        isGoodHabit: undefined,
        lastCompleted: addedTodo.lastCompleted
          ? new Date(addedTodo.lastCompleted)
          : undefined,
        nextDue: addedTodo.nextDue ? new Date(addedTodo.nextDue) : undefined,
        originalTime: undefined,
        // auraValue: 0, // Removed - Not part of Task interface/model
        userId: addedTodo.userId || "unknown", // Handle potential missing userId
      };

      // Add the new todo (with correct dates/type) to the start of the list
      set((currentState) => ({
        todos: [todoWithDates, ...currentState.todos],
        isLoading: false, // Reset loading state
        error: null,
      }));
      return todoWithDates;
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
      error: null, // Clear previous errors on new action
    }));

    try {
      const result = await toggleTodoAPI(taskId); // Call API
      // Update completion state based on response
      set((state) => ({
        todos: state.todos.map((t) =>
          t.id === taskId ? { ...t, completed: result.completed } : t
        ),
      }));
      // Return result from API (includes auraChange calculated by backend)
      return { completed: result.completed, auraChange: result.auraChange };
    } catch (err) {
      console.error(`Failed to toggle todo ${taskId}:`, err);
      // Rollback optimistic update
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
              // Handle deadline update optimistically: null clears, undefined keeps old, Date sets new
              deadline:
                newDeadline === null
                  ? undefined
                  : newDeadline !== undefined
                  ? newDeadline
                  : t.deadline,
            }
          : t
      ),
      error: null, // Clear previous errors
    }));

    try {
      const payload = { title: newTitle, deadline: newDeadline }; // Send null to clear deadline
      const updatedTodo = await updateTodoAPI(taskId, payload); // Call API

      // Update state with confirmed data from API, ensuring dates are correct
      const todoWithDates: Task = {
        ...updatedTodo,
        category: "todo",
        createdAt: new Date(updatedTodo.createdAt),
        updatedAt: new Date(updatedTodo.updatedAt),
        deadline: updatedTodo.deadline
          ? new Date(updatedTodo.deadline)
          : undefined,
        isHabit: false,
        frequency: undefined,
        isGoodHabit: undefined,
        lastCompleted: updatedTodo.lastCompleted
          ? new Date(updatedTodo.lastCompleted)
          : undefined,
        nextDue: updatedTodo.nextDue
          ? new Date(updatedTodo.nextDue)
          : undefined,
        originalTime: undefined,
        // auraValue: 0, // Removed
        userId: updatedTodo.userId || "unknown",
      };

      set((state) => ({
        todos: state.todos.map((t) => (t.id === taskId ? todoWithDates : t)),
        error: null, // Ensure error state is cleared on success
      }));
    } catch (err) {
      console.error(`Failed to update todo ${taskId}:`, err);
      // Rollback optimistic update
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
      error: null, // Clear previous errors
    }));

    try {
      await deleteTodoAPI(taskId); // Call API
      set({ error: null }); // Ensure error state is cleared on success
    } catch (err) {
      console.error(`Failed to delete todo ${taskId}:`, err);
      // Rollback optimistic update
      set({
        todos: originalTodos,
        error: `Failed to delete todo: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
    }
  },
});

// Create the store WITH persist middleware applied correctly
const useTodoStore = create<TodoState>()(
  persist(todoStoreCreator, {
    name: "todo-storage",
    storage: createJSONStorage(() => localStorage),
    partialize: (state): PersistedTodoState => ({
      todos: state.todos,
      lastSelectedDate: state.lastSelectedDate,
    }),
    onRehydrateStorage: () => {
      console.log("Attempting hydration for todos...");
      return (state, error) => {
        if (error) {
          console.error("Failed to hydrate todos:", error);
          return;
        }
        if (state) {
          state.todos = state.todos.map((t: any) => ({
            // Use any temporarily
            ...t,
            category: "todo", // Ensure category is correct on rehydration
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
          console.log("Todo hydration successful.");
        } else {
          console.log("No persisted todo state found.");
        }
      };
    },
    version: 1,
  })
);

export default useTodoStore;
