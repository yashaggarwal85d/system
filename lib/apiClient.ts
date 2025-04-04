import {
  Task as PrismaTask, // Rename imported Task to avoid conflict
  Routine as PrismaRoutine,
  ChecklistItem as PrismaChecklistItem,
} from "@prisma/client";
import { Task } from "./interfaces/task"; // Import frontend Task interface
import { Frequency, Routine } from "./interfaces/routine"; // Import frontend Routine interface and Frequency
import { HabitConfig } from "./interfaces/habit";
import { ChecklistItemData } from "@/components/ui/checklist-item";

const API_BASE = "/api"; // Base path for API routes

// Helper function to handle fetch responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Failed to parse error response" }));
    console.error("API Error:", response.status, errorData);
    throw new Error(
      errorData.error || `Request failed with status ${response.status}`
    );
  }
  return response.json() as Promise<T>;
}

// Helper to convert API Task response (PrismaTask) to frontend Task type
const mapApiTaskToFrontend = (apiTask: PrismaTask): Task => {
  return {
    ...apiTask,
    // Ensure correct types for dates and potentially null fields
    createdAt: new Date(apiTask.createdAt),
    updatedAt: new Date(apiTask.updatedAt),
    deadline: apiTask.deadline ? new Date(apiTask.deadline) : undefined,
    lastCompleted: apiTask.lastCompleted
      ? new Date(apiTask.lastCompleted)
      : undefined,
    nextDue: apiTask.nextDue ? new Date(apiTask.nextDue) : undefined,
    auraValue: apiTask.auraValue ?? undefined, // Map null to undefined
    isHabit: apiTask.isHabit ?? undefined, // Map null to undefined
    isGoodHabit: apiTask.isGoodHabit ?? undefined, // Map null to undefined
    originalTime: apiTask.originalTime ?? undefined, // Map null to undefined
    // Cast frequency JSON to the expected HabitConfig type
    frequency: apiTask.frequency
      ? (apiTask.frequency as HabitConfig)
      : undefined,
    // Ensure category is correctly typed if necessary (though Prisma type might suffice)
    category: apiTask.category as "todo" | "habit", // Cast if needed
  };
};

// --- Todos API ---

export const fetchTodosAPI = async (): Promise<Task[]> => {
  const response = await fetch(`${API_BASE}/todos`);
  const apiTasks = await handleResponse<PrismaTask[]>(response);
  return apiTasks.map(mapApiTaskToFrontend); // Map to frontend type
};

export const addTodoAPI = async (data: {
  title: string;
  deadline?: Date | null;
}): Promise<Task> => {
  const response = await fetch(`${API_BASE}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const newApiTask = await handleResponse<PrismaTask>(response);
  return mapApiTaskToFrontend(newApiTask); // Map to frontend type
};

export const updateTodoAPI = async (
  id: string,
  data: { title: string; deadline?: Date | null }
): Promise<Task> => {
  const response = await fetch(`${API_BASE}/todos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const updatedApiTask = await handleResponse<PrismaTask>(response);
  return mapApiTaskToFrontend(updatedApiTask); // Map to frontend type
};

export const toggleTodoAPI = async (
  id: string
): Promise<{ completed: boolean; auraChange: number }> => {
  const response = await fetch(`${API_BASE}/todos/${id}`, {
    method: "PATCH", // Using PATCH for toggle
  });
  return handleResponse<{ completed: boolean; auraChange: number }>(response);
};

export const deleteTodoAPI = async (
  id: string
): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE}/todos/${id}`, {
    method: "DELETE",
  });
  // DELETE might return 204 No Content, handle that
  if (response.status === 204) {
    return { message: "Todo deleted successfully" };
  }
  return handleResponse<{ message: string }>(response);
};

// --- Habits API ---

export const fetchHabitsAPI = async (): Promise<Task[]> => {
  const response = await fetch(`${API_BASE}/habits`);
  const apiTasks = await handleResponse<PrismaTask[]>(response);
  return apiTasks.map(mapApiTaskToFrontend); // Map to frontend type
};

export const addHabitAPI = async (data: {
  title: string;
  frequency: HabitConfig;
}): Promise<Task> => {
  const response = await fetch(`${API_BASE}/habits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const newApiTask = await handleResponse<PrismaTask>(response);
  return mapApiTaskToFrontend(newApiTask); // Map to frontend type
};

export const updateHabitAPI = async (
  id: string,
  data: { title: string; frequency?: HabitConfig }
): Promise<Task> => {
  const response = await fetch(`${API_BASE}/habits/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const updatedApiTask = await handleResponse<PrismaTask>(response);
  return mapApiTaskToFrontend(updatedApiTask); // Map to frontend type
};

export const toggleHabitAPI = async (
  id: string
): Promise<{
  completed: boolean;
  auraChange: number;
  nextDue: Date | null;
}> => {
  const response = await fetch(`${API_BASE}/habits/${id}`, {
    method: "PATCH",
  });
  // Need to handle potential null nextDue from API
  const result = await handleResponse<{
    completed: boolean;
    auraChange: number;
    nextDue: string | null;
  }>(response);
  return {
    ...result,
    nextDue: result.nextDue ? new Date(result.nextDue) : null, // Convert string date back to Date object or null
  };
};

export const deleteHabitAPI = async (
  id: string
): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE}/habits/${id}`, {
    method: "DELETE",
  });
  if (response.status === 204) {
    return { message: "Habit deleted successfully" };
  }
  return handleResponse<{ message: string }>(response);
};

// --- Routines API ---

// Type returned by the API routes (Prisma Routine + Prisma ChecklistItem)
type ApiRoutineResponse = PrismaRoutine & { checklist: PrismaChecklistItem[] };

// Helper to convert API response to frontend Routine type
const mapApiRoutineToFrontend = (apiRoutine: ApiRoutineResponse): Routine => {
  return {
    ...apiRoutine,
    frequency: apiRoutine.frequency as Frequency, // Cast JSON frequency
    createdAt: new Date(apiRoutine.createdAt),
    updatedAt: new Date(apiRoutine.updatedAt),
    nextDue: apiRoutine.nextDue ? new Date(apiRoutine.nextDue) : undefined, // Map null to undefined
    lastCompleted: apiRoutine.lastCompleted
      ? new Date(apiRoutine.lastCompleted)
      : undefined, // Map null to undefined
    checklist: (apiRoutine.checklist || []).map((item) => ({
      // Map checklist items
      id: item.id,
      text: item.text,
      completed: item.completed,
      level: item.level,
      children: [], // Add empty children array to match ChecklistItemData
    })),
    auraValue: apiRoutine.auraValue ?? undefined, // Map null to undefined
    // Ensure all properties from frontend Routine interface are present
    // userId is already present from PrismaRoutine
    // completed is already present
    // name is already present
  };
};

export const fetchRoutinesAPI = async (): Promise<Routine[]> => {
  const response = await fetch(`${API_BASE}/routines`);
  const apiRoutines = await handleResponse<ApiRoutineResponse[]>(response);
  return apiRoutines.map(mapApiRoutineToFrontend); // Map to frontend type
};

export const addRoutineAPI = async (data: {
  name: string;
  frequency: Frequency; // Use correct Frequency type
  checklist: Partial<ChecklistItemData>[]; // API expects partial items for creation
}): Promise<Routine> => {
  // Return frontend Routine type
  const response = await fetch(`${API_BASE}/routines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const newApiRoutine = await handleResponse<ApiRoutineResponse>(response);
  return mapApiRoutineToFrontend(newApiRoutine); // Map to frontend type
};

export const updateRoutineAPI = async (
  id: string,
  data: {
    name: string;
    frequency?: Frequency; // Use correct Frequency type
    checklist: Partial<ChecklistItemData>[]; // API expects partial items for update/upsert
  }
): Promise<Routine> => {
  // Return frontend Routine type
  const response = await fetch(`${API_BASE}/routines/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const updatedApiRoutine = await handleResponse<ApiRoutineResponse>(response);
  return mapApiRoutineToFrontend(updatedApiRoutine); // Map to frontend type
};

export const deleteRoutineAPI = async (
  id: string
): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE}/routines/${id}`, {
    method: "DELETE",
  });
  if (response.status === 204) {
    return { message: "Routine deleted successfully" };
  }
  return handleResponse<{ message: string }>(response);
};

// --- Checklist Item API (Example - if needed separately) ---
// Note: Currently checklist updates are handled via PUT /api/routines/[id]

// export const toggleChecklistItemAPI = async (routineId: string, itemId: string): Promise<any> => {
//     const response = await fetch(`${API_BASE}/routines/${routineId}/checklist/${itemId}`, { // Example route
//         method: 'PATCH',
//     });
//     return handleResponse<any>(response);
// };
