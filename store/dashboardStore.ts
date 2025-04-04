import { create, StateCreator } from "zustand";
import { Player } from "@/lib/interfaces/player";

interface DashboardState {
  activeTab: string;
  player: Player | null; // Player can be null initially
  isLoading: boolean;
  error: string | null;

  setActiveTab: (tab: string) => void;
  fetchPlayer: (userId: string) => Promise<void>;
  addAura: (amount: number) => Promise<void>;
  subtractAura: (amount: number) => Promise<void>;
}

const dashboardStoreCreator: StateCreator<DashboardState> = (set, get) => ({
  activeTab: "todos",
  player: null, // Initialize player as null
  isLoading: false, // Start with isLoading: false
  error: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

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
        playerDescription: "Simulated player description", // Added placeholder description
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
  },
});

// Create the store WITHOUT persist
const useDashboardStore = create(dashboardStoreCreator);

export default useDashboardStore;
