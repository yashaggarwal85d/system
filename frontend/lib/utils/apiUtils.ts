import {
  Player,
  PlayerFullInfo,
  ChatHistoryEntry,
  VaultData,
  CategorizedTransaction,
} from "./interfaces";
import { API_BASE, fetchWithAuth, handleResponse } from "./authUtils";

interface FinanceDataResponse {
  transactions: CategorizedTransaction[];
  suggestions: string[];
}

interface UploadResponse {
  message: string;
  added: number;
  skipped: number;
  failed: number;
}

export const signupPlayer = async (
  playerData: Omit<Player, "level" | "aura" | "description"> & {
    password: string;
  }
): Promise<Player> => {
  const response = await fetch(`${API_BASE}/players/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(playerData),
  });
  return await handleResponse<Player>(response);
};

export const loginPlayer = async (
  username: string,
  password: string
): Promise<{ access_token: string; token_type: string }> => {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const loginUrl = `${API_BASE}/players/login`;
  const response = await fetch(loginUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  return await handleResponse<{ access_token: string; token_type: string }>(
    response
  );
};

export const fetchPlayerData = async (): Promise<Player> => {
  const response = await fetchWithAuth(`${API_BASE}/players/me`);
  const player = await handleResponse<Player>(response);
  return player;
};

export const fetchPlayerFullInfoAPI = async (): Promise<PlayerFullInfo> => {
  const response = await fetchWithAuth(`${API_BASE}/players/me/full`);
  const fullInfo = await handleResponse<PlayerFullInfo>(response);
  return fullInfo;
};

export const updatePlayer = async (
  player: Partial<Player>
): Promise<Player> => {
  const response = await fetchWithAuth(`${API_BASE}/players/me/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(player),
  });
  return await handleResponse<Player>(response);
};

export const addEntityAPI = async <T>(entity: string, data: T): Promise<T> => {
  const response = await fetchWithAuth(`${API_BASE}/${entity}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return await handleResponse<T>(response);
};

export const updateEntityAPI = async <T>(
  entity: string,
  id: string,
  data: Partial<T>
): Promise<T> => {
  const response = await fetchWithAuth(`${API_BASE}/${entity}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return await handleResponse<T>(response);
};

export const deleteEntityAPI = async (
  entity: string,
  id: string
): Promise<{ message: string }> => {
  const response = await fetchWithAuth(`${API_BASE}/${entity}/${id}`, {
    method: "DELETE",
  });
  if (response.status === 204) {
    return { message: `${entity} deleted successfully` };
  }
  return await handleResponse<{ message: string }>(response);
};

export const sendChatMessageAPI = async (
  user_message: string
): Promise<{ reply: string; action_taken?: boolean; mentor?: string }> => {
  const encodedMessage = encodeURIComponent(user_message);
  const url = `${API_BASE}/chat?user_message=${encodedMessage}`;

  const response = await fetchWithAuth(url, {
    method: "POST",
  });
  return await handleResponse<{
    reply: string;
    action_taken?: boolean;
    mentor?: string;
  }>(response);
};

export const fetchChatHistoryAPI = async (): Promise<ChatHistoryEntry[]> => {
  const response = await fetchWithAuth(`${API_BASE}/chat/history`);
  return await handleResponse<ChatHistoryEntry[]>(response);
};

export const clearChatHistoryAPI = async (): Promise<{ message: string }> => {
  const response = await fetchWithAuth(`${API_BASE}/chat/history`, {
    method: "DELETE",
  });
  if (response.status === 204) {
    return { message: "Chat history cleared successfully" };
  }
  return await handleResponse<{ message: string }>(response);
};

export const fetchNotesData = async (): Promise<VaultData> => {
  const response = await fetchWithAuth(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/players/me/notes`
  );
  return await handleResponse<VaultData>(response);
};

export const fetchFinanceData = async (): Promise<FinanceDataResponse> => {
  console.log("API: Fetching finance data...");
  const response = await fetchWithAuth(`${API_BASE}/finance/data`);

  const data = await handleResponse<FinanceDataResponse>(response);
  console.log(`API: Fetched ${data.transactions.length} transactions.`);
  return data;
};

export const uploadRawFile = async (file: File): Promise<UploadResponse> => {
  console.log(`API: Uploading file ${file.name}...`);
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithAuth(`${API_BASE}/finance/upload-raw`, {
    method: "POST",
    body: formData,
  });

  const result = await handleResponse<UploadResponse>(response);
  console.log(
    `API: File upload result - Added: ${result.added}, Skipped: ${result.skipped}, Failed: ${result.failed}`
  );
  return result;
};
