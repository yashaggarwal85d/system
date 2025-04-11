import { create, StateCreator } from "zustand";
import { Player, PlayerFullInfo } from "@/lib/utils/interfaces";
import {
  fetchPlayerFullInfoAPI,
  updateEntityAPI,
  updatePlayer,
} from "@/lib/utils/apiUtils";
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
  activeTab: "tasks",
  player: null,
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
    if (!currentPlayer || !currentPlayer.username) return;

    const newAura = currentPlayer.aura + amount;
    let newPlayer: Partial<Player> = {
      aura: newAura,
    };
    if (newAura >= currentPlayer.level * 100) {
      newPlayer = {
        ...newPlayer,
        level: currentPlayer.level + 1,
        description: " You are now level " + (currentPlayer.level + 1),
      };
    }
    set({ player: { ...currentPlayer, ...newPlayer } });
    console.log(newAura, get().player);
    await updatePlayer({ ...newPlayer });
  },
});

const useDashboardStore = create(dashboardStoreCreator);

export default useDashboardStore;
