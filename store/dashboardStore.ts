import { create, StateCreator } from "zustand";
import { Player, PlayerFullInfo } from "@/lib/utils/interfaces";
import { ColorTheme, defaultTheme, getThemeForLevel } from "@/lib/utils/colors";
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
  currentTheme: ColorTheme;
  isLoading: boolean;
  error: string | null;

  setActiveTab: (tab: string) => void;
  fetchPlayer: () => void;
  modifyAura: (amount: number) => void;
}

const dashboardStoreCreator: StateCreator<DashboardState> = (set, get) => ({
  activeTab: "tasks",
  player: null,
  currentTheme: defaultTheme,
  isLoading: false,
  error: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  fetchPlayer: async () => {
    set({ isLoading: true, error: null });
    try {
      const fullPlayerData: PlayerFullInfo = await fetchPlayerFullInfoAPI();
      const playerLevel = fullPlayerData.player.level;
      const theme = getThemeForLevel(playerLevel);
      set({
        player: fullPlayerData.player,
        currentTheme: theme,
        isLoading: false,
      });
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
      const newLevel = currentPlayer.level + 1;
      newPlayer = {
        ...newPlayer,
        level: newLevel,
        description: " You are now level " + newLevel,
      };
      // Update theme if level changed
      const newTheme = getThemeForLevel(newLevel);
      set({
        player: { ...currentPlayer, ...newPlayer },
        currentTheme: newTheme,
      });
    } else {
      set({ player: { ...currentPlayer, ...newPlayer } });
    }

    console.log(newAura, get().player);
    await updatePlayer({ ...newPlayer });
  },
});

const useDashboardStore = create(dashboardStoreCreator);

export default useDashboardStore;
