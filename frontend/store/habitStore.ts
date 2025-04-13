import { Habit } from "@/lib/utils/interfaces";
import { getAuraValue, formatDateToDDMMYY } from "@/lib/utils/commonUtils";
import { createGenericPersistedStore, GenericState } from "./genericStore";

interface HabitState extends GenericState<Habit> {}

const useHabitStore = createGenericPersistedStore<Habit>(
  {
    entityNamePlural: "habits",
    persistenceName: "Habit-storage",

    transformOnHydrate: (persistedEntities) => {
      if (!Array.isArray(persistedEntities)) return [];
      return persistedEntities.map((h: any) => ({
        ...h,

        start_date: h.start_date,
        last_completed: h.last_completed,
      }));
    },
  },
  {
    version: 1,
  }
);

export default useHabitStore;
