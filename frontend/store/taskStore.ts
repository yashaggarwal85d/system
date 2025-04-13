import { Task } from "@/lib/utils/interfaces";
import { getAuraValue } from "@/lib/utils/commonUtils";
import { createGenericPersistedStore, GenericState } from "./genericStore";

interface TaskState extends GenericState<Task> {}

const useTaskStore = createGenericPersistedStore<Task>(
  {
    entityNamePlural: "tasks",
    persistenceName: "task-storage",

    getAuraValueFn: () => getAuraValue("task"),

    transformOnHydrate: (persistedEntities) => {
      if (!Array.isArray(persistedEntities)) return [];
      return persistedEntities.map((t: any) => ({
        ...t,

        due_date: t.due_date,
      }));
    },
  },
  {
    version: 1,
  }
);

export default useTaskStore;
