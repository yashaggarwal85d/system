import { create, StateCreator } from "zustand";
import { Player, PlayerFullInfo } from "@/lib/utils/interfaces"; // Import PlayerFullInfo
import { fetchPlayerFullInfoAPI } from "@/lib/utils/apiUtils"; // Import the new API function
import useTaskStore from "./taskStore";
import useHabitStore from "./habitStore";
import useRoutineStore from "./routineStore";
import useScrambleStore from "./scrambleStore";

interface DashboardState {
  activeTab: string;
  player: Player | null;
  isLoading: boolean;
  error: string | null;

  setActiveTab: (tab: string) => void;
  fetchPlayer: () => void;
  modifyAura: (amount: number) => void;
}

const dashboardStoreCreator: StateCreator<DashboardState> = (set, get) => ({
  activeTab: "task",
  player: null, // Initialize player as null
  isLoading: false,
  error: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  fetchPlayer: async () => {
    try {
      const fullPlayerData: PlayerFullInfo = await fetchPlayerFullInfoAPI();
      set({ isLoading: true, error: null, player: fullPlayerData.player });
      useHabitStore.getState().setHabits(fullPlayerData.habits);
      useTaskStore.getState().setTasks(fullPlayerData.tasks);
      useRoutineStore.getState().setRoutines(fullPlayerData.routines);
      const scramble = fullPlayerData.player.description.split(",");
      useScrambleStore.getState().setPhrases(scramble);
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

  modifyAura: async (amount) => {
    const currentPlayer = get().player;
    if (!currentPlayer || amount <= 0) return;

    let optimisticPlayer = { ...currentPlayer };
    const newAura = optimisticPlayer.aura + amount;
    if (newAura >= optimisticPlayer.level * 100) {
      optimisticPlayer.level += 1;
      optimisticPlayer.description =
        optimisticPlayer.description + "," + "You have levelled up!";
    }
    optimisticPlayer.aura = newAura;
    set({ player: optimisticPlayer });
  },
});

// Create the store WITHOUT persist
const useDashboardStore = create(dashboardStoreCreator);

export default useDashboardStore;
