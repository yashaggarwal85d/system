import { Player, PlayerFullInfo } from "./interfaces";
import { API_BASE, fetchWithAuth, handleResponse } from "./authUtils";

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
