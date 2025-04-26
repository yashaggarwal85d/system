import { create, StateCreator } from "zustand";
import { Player, PlayerFullInfo } from "@/lib/utils/interfaces";
import { ColorTheme, defaultTheme } from "@/lib/utils/colors";
import { fetchPlayerFullInfoAPI, updatePlayer } from "@/lib/utils/apiUtils";
import useTaskStore from "./taskStore";
import useHabitStore from "./habitStore";
import useRoutineStore from "./routineStore";
import { stringToChecklist } from "@/lib/utils/commonUtils";

interface DashboardState {
  activeTab: string;
  player: Player | null;
  currentTheme: ColorTheme;
  isLoading: boolean;
  error: string | null;

  setActiveTab: (tab: string) => void;
  fetchPlayer: () => void;
  modifyAura: (amount: number) => void;
  setCurrentTheme: (theme: ColorTheme) => void;
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
      var fullPlayerData: PlayerFullInfo = await fetchPlayerFullInfoAPI();
      fullPlayerData.routines = fullPlayerData.routines.map((routine) => ({
        ...routine,
        checklist: stringToChecklist(routine.checklist.toString()),
      }));
      set({
        player: fullPlayerData.player,
        isLoading: false,
      });
      useHabitStore.getState().setEntities(fullPlayerData.habits);
      useTaskStore.getState().setEntities(fullPlayerData.tasks);
      useRoutineStore.getState().setEntities(fullPlayerData.routines);
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

  setCurrentTheme: (theme) => set({ currentTheme: theme }),

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
      set({
        player: { ...currentPlayer, ...newPlayer },
      });
    } else {
      set({ player: { ...currentPlayer, ...newPlayer } });
    }
    await updatePlayer({ ...newPlayer });
  },
});

const useDashboardStore = create(dashboardStoreCreator);

export default useDashboardStore;
