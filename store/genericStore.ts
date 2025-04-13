import { create, StateCreator } from "zustand";
import { persist, createJSONStorage, PersistOptions } from "zustand/middleware";
import { toast } from "sonner";
import {
  addEntityAPI,
  deleteEntityAPI,
  updateEntityAPI,
} from "@/lib/utils/apiUtils";

interface BaseEntity {
  id?: string;
}

type Entity = BaseEntity;

type EntityUpdatePayload<T extends Entity> = Partial<Omit<T, "id">>;

export interface GenericState<T extends Entity> {
  entities: T[];
  isLoading: boolean;
  error: string | null;
  setEntities: (entities: T[]) => void;
  setError: (error: string | null) => void;

  addEntity: (
    entityData: Omit<T, "id"> & { userId: string }
  ) => Promise<T | null>;
  updateEntity: (
    id: string,
    entityUpdate: EntityUpdatePayload<T>
  ) => Promise<T | null>;
  deleteEntity: (id: string) => Promise<boolean>;

  [key: string]: any;
}

interface GenericStoreOptions<T extends Entity> {
  entityNamePlural: string;
  persistenceName: string;
  getAuraValueFn?: () => number;
  transformPayloadForApi?: (payload: any) => any;
  transformResponseFromApi?: (response: any) => T;
  transformOnHydrate?: (persistedState: any) => T[];
}

export type GenericStoreCreator<T extends Entity> = StateCreator<
  GenericState<T>,
  [],
  []
>;

export function createGenericStoreSlice<T extends Entity>(
  options: GenericStoreOptions<T>
): GenericStoreCreator<T> {
  const {
    entityNamePlural,
    getAuraValueFn,
    transformPayloadForApi = (p) => p,
    transformResponseFromApi = (r) => r as T,
  } = options;

  return (set, get) => ({
    entities: [],
    isLoading: false,
    error: null,

    setError: (error) => set({ error, isLoading: false }),

    setEntities: (entities) =>
      set({ entities: entities, isLoading: false, error: null }),

    addEntity: async (entityData) => {
      if (!entityData.userId) {
        const errorMsg = `User ID is required within data to add a ${entityNamePlural}.`;
        set({ error: errorMsg, isLoading: false });
        console.error(
          `addEntity (${entityNamePlural}) called without userId in data`
        );
        toast.error(errorMsg);
        return null;
      }
      set({ isLoading: true });
      try {
        let payload: any = { ...entityData };

        const transformedPayload = transformPayloadForApi(payload);
        const addedRaw = await addEntityAPI<any>(
          entityNamePlural,
          transformedPayload
        );
        const addedEntity = transformResponseFromApi(addedRaw);

        set((currentState) => ({
          entities: [addedEntity, ...currentState.entities],
          isLoading: false,
          error: null,
        }));
        return addedEntity;
      } catch (err) {
        console.error(`Failed to add ${entityNamePlural}:`, err);
        const errorMsg =
          err instanceof Error ? err.message : "An unknown error occurred";
        const finalErrorMsg = `Failed to add ${entityNamePlural.slice(
          0,
          -1
        )}: ${errorMsg}`;
        set({ error: finalErrorMsg, isLoading: false });
        toast.error(finalErrorMsg);
        return null;
      }
    },

    updateEntity: async (id, entityUpdate) => {
      if (!id) {
        const errorMsg = `ID is required to update ${entityNamePlural}.`;
        console.error(`updateEntity (${entityNamePlural}) called without ID.`);
        toast.error(errorMsg);

        return null;
      }
      set({ isLoading: true });
      try {
        const transformedPayload = transformPayloadForApi(entityUpdate);
        const updatedRaw = await updateEntityAPI<any>(
          entityNamePlural,
          id,
          transformedPayload
        );
        const updatedEntity = transformResponseFromApi(updatedRaw);

        set((state) => ({
          entities: state.entities.map((e) =>
            e.id === id ? { ...e, ...updatedEntity } : e
          ),
          isLoading: false,
          error: null,
        }));
        return updatedEntity;
      } catch (err) {
        console.error(`Failed to update ${entityNamePlural}:`, err);
        const errorMsg =
          err instanceof Error ? err.message : "An unknown error occurred";
        const finalErrorMsg = `Failed to update ${entityNamePlural.slice(
          0,
          -1
        )}: ${errorMsg}`;
        set({ error: finalErrorMsg, isLoading: false });
        toast.error(finalErrorMsg);
        return null;
      }
    },

    deleteEntity: async (id) => {
      if (!id) {
        const errorMsg = `ID is required to delete ${entityNamePlural}.`;
        console.error(`deleteEntity (${entityNamePlural}) called without ID.`);
        toast.error(errorMsg);

        return false;
      }
      set({ isLoading: true });
      try {
        await deleteEntityAPI(entityNamePlural, id);
        set((state) => ({
          entities: state.entities.filter((e) => e.id !== id),
          error: null,
          isLoading: false,
        }));
        return true;
      } catch (err) {
        console.error(`Failed to delete ${entityNamePlural}:`, err);
        const errorMsg =
          err instanceof Error ? err.message : "An unknown error occurred";
        const finalErrorMsg = `Failed to delete ${entityNamePlural.slice(
          0,
          -1
        )}: ${errorMsg}`;
        set({ error: finalErrorMsg, isLoading: false });
        toast.error(finalErrorMsg);
        return false;
      }
    },
  });
}

export type GenericPersistOptions<T extends Entity> = Omit<
  PersistOptions<GenericState<T>, { entities: T[] }>,
  "name" | "storage" | "partialize" | "onRehydrateStorage"
>;

export function createGenericPersistedStore<T extends Entity>(
  options: GenericStoreOptions<T>,
  persistOptions?: GenericPersistOptions<T>
) {
  const slice = createGenericStoreSlice<T>(options);

  return create<GenericState<T>>()(
    persist(slice, {
      name: options.persistenceName,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): { entities: T[] } => ({
        entities: state.entities,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error(
              `Failed to hydrate ${options.persistenceName}:`,
              error
            );
            toast.error(`Failed to load saved ${options.entityNamePlural}.`);
            return;
          }
          if (state) {
            if (options.transformOnHydrate) {
              try {
                const persistedEntities = (state as any).entities;
                state.entities = options.transformOnHydrate(persistedEntities);
              } catch (transformError) {
                console.error(
                  `Error transforming hydrated state for ${options.persistenceName}:`,
                  transformError
                );
                toast.error(`Error loading saved ${options.entityNamePlural}.`);
                state.entities = [];
              }
            }
            state.isLoading = false;
            state.error = null;
          } else {
          }
        };
      },
      version: 1,
      ...persistOptions,
    })
  );
}
