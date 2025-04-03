import {
  Task,
  Routine as PrismaRoutine,
  ChecklistItem as PrismaChecklistItem,
} from "@prisma/client";
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

// --- Todos API ---

export const fetchTodosAPI = async (): Promise<Task[]> => {
  const response = await fetch(`${API_BASE}/todos`);
  return handleResponse<Task[]>(response);
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
  return handleResponse<Task>(response);
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
  return handleResponse<Task>(response);
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
  return handleResponse<Task[]>(response);
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
  return handleResponse<Task>(response);
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
  return handleResponse<Task>(response);
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
