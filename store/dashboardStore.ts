import { create, StateCreator } from "zustand";
import { Player } from "@/lib/interfaces/player";
// We will need API fetching functions later
// import { fetchPlayerData, updatePlayerDataAPI } from '@/lib/api';

interface DashboardState {
  activeTab: string;
  player: Player | null; // Player can be null initially
  isLoading: boolean;
  error: string | null;

  setActiveTab: (tab: string) => void;
  // setPlayer: (player: Player | ((prev: Player | null) => Player | null)) => void; // Direct setPlayer might be removed/internalized
  fetchPlayer: (userId: string) => Promise<void>;
  addAura: (amount: number) => Promise<void>; // Actions become async
  subtractAura: (amount: number) => Promise<void>; // Actions become async
  // _hasHydrated?: boolean; // No longer needed
}

// Define the state initializer function separately using StateCreator
const dashboardStoreCreator: StateCreator<DashboardState> = (set, get) => ({
  activeTab: "todos",
  player: null, // Initialize player as null
  isLoading: false, // Start with isLoading: false
  error: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  // Internal function to update player state, might be called by fetch/update actions
  _updatePlayerState: (playerData: Partial<Player>) =>
    set((state) => ({
      player: state.player ? { ...state.player, ...playerData } : null, // Merge updates or handle null case
      isLoading: false,
      error: null,
    })),

  fetchPlayer: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      // --- TODO: Replace with actual API call ---
      console.log(`TODO: Fetch player data for userId: ${userId}`);
      // const playerData = await fetchPlayerData(userId);
      // Simulating fetched data for now
      const simulatedPlayerData: Player = {
        id: userId, // Use the provided userId (or fetch based on it)
        name: "FETCHED_USER", // Placeholder name
        level: 5,
        aura: 50,
        auraToNextLevel: 500,
        title: "Adept",
        createdAt: new Date(), // Added placeholder
        updatedAt: new Date(), // Added placeholder
        userId: userId, // Link back to user
      };
      set({ player: simulatedPlayerData, isLoading: false });
      // --- End TODO ---
    } catch (err) {
      console.error("Failed to fetch player data:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      set({
        error: `Failed to load player data: ${errorMsg}`,
        isLoading: false,
        player: null,
      });
    }
  },

  addAura: async (amount) => {
    const currentPlayer = get().player;
    if (!currentPlayer || amount <= 0) return;

    // --- Optimistic Update (Optional but good UX) ---
    // Calculate potential new state locally first
    let optimisticPlayer = { ...currentPlayer };
    const newAura = optimisticPlayer.aura + amount;
    if (newAura >= optimisticPlayer.auraToNextLevel) {
      // Simplified level up logic for optimistic update - real logic on backend
      optimisticPlayer.level += 1;
      optimisticPlayer.aura = newAura - optimisticPlayer.auraToNextLevel; // Rough estimate
      // Don't update title/nextAura optimistically, let backend handle it
    } else {
      optimisticPlayer.aura = newAura;
    }
    set({ player: optimisticPlayer }); // Update UI immediately
    // --- End Optimistic Update ---

    try {
      // --- TODO: Replace with actual API call ---
      console.log(
        `TODO: Call API to add ${amount} aura for player ${currentPlayer.id}`
      );
      // const updatedPlayer = await updatePlayerDataAPI(currentPlayer.id, { auraIncrement: amount });
      // set({ player: updatedPlayer, error: null }); // Update with confirmed data from backend
      // Simulating backend update for now - just log
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
      console.log("Simulated backend aura update successful.");
      // In real scenario, fetch updated player or trust optimistic update if API returns minimal response
      // For now, we keep the optimistic state unless an error occurs
      // --- End TODO ---
    } catch (err) {
      console.error("Failed to add aura:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      // --- Rollback Optimistic Update ---
      set({
        player: currentPlayer,
        error: `Failed to update aura: ${errorMsg}`,
      });
      // --- End Rollback ---
    }
  },

  subtractAura: async (amount) => {
    const currentPlayer = get().player;
    if (!currentPlayer || amount <= 0) return;

    // --- Optimistic Update ---
    let optimisticPlayer = { ...currentPlayer };
    let newAura = optimisticPlayer.aura - amount;
    // Simplified de-level logic for optimistic update
    if (newAura < 0 && optimisticPlayer.level > 1) {
      optimisticPlayer.level -= 1;
      // Don't try to calculate previous threshold optimistically
      optimisticPlayer.aura = 0; // Reset to 0 on de-level for simplicity
    } else {
      optimisticPlayer.aura = Math.max(0, newAura); // Ensure aura doesn't go below 0
    }
    set({ player: optimisticPlayer });
    // --- End Optimistic Update ---

    try {
      // --- TODO: Replace with actual API call ---
      console.log(
        `TODO: Call API to subtract ${amount} aura for player ${currentPlayer.id}`
      );
      // const updatedPlayer = await updatePlayerDataAPI(currentPlayer.id, { auraDecrement: amount });
      // set({ player: updatedPlayer, error: null });
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log("Simulated backend aura subtraction successful.");
      // --- End TODO ---
    } catch (err) {
      console.error("Failed to subtract aura:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      // --- Rollback Optimistic Update ---
      set({
        player: currentPlayer,
        error: `Failed to update aura: ${errorMsg}`,
      });
      // --- End Rollback ---
    }
  },
});

// Create the store WITHOUT persist
const useDashboardStore = create(dashboardStoreCreator);

export default useDashboardStore;
