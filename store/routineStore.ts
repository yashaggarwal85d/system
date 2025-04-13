import { Routine, ChecklistItemData } from "@/lib/utils/interfaces";
import {
  getAuraValue,
  formatDateToDDMMYY,
  checklistToString,
  stringToChecklist,
} from "@/lib/utils/commonUtils";
import { createGenericPersistedStore, GenericState } from "./genericStore";

interface RoutineState extends GenericState<Routine> {}

const useRoutineStore = createGenericPersistedStore<Routine>(
  {
    entityNamePlural: "routines",
    persistenceName: "Routine-storage",

    transformPayloadForApi: (payload) => {
      if (payload.checklist && Array.isArray(payload.checklist)) {
        return { ...payload, checklist: checklistToString(payload.checklist) };
      }
      return payload;
    },
    transformResponseFromApi: (response) => {
      if (response.checklist && typeof response.checklist === "string") {
        return {
          ...response,
          checklist: stringToChecklist(response.checklist),
        };
      }

      if (!Array.isArray(response.checklist)) {
        response.checklist = [];
      }
      return response as Routine;
    },
    transformOnHydrate: (persistedEntities) => {
      if (!Array.isArray(persistedEntities)) return [];
      return persistedEntities.map((r: any) => ({
        ...r,
        checklist:
          typeof r.checklist === "string"
            ? stringToChecklist(r.checklist)
            : Array.isArray(r.checklist)
            ? r.checklist
            : [],

        start_date: r.start_date,
        last_completed: r.last_completed,
      }));
    },
  },
  {
    version: 1,
  }
);

export default useRoutineStore;
