import { create, StateCreator } from "zustand";
// TODO: Import API function: import { fetchScrambledPhrasesAPI } from '@/lib/api';

interface ScrambleState {
  phrases: string[]; // Phrases fetched for the current user
  currentPhraseIndex: number;
  isLoading: boolean;
  error: string | null;
  getNextPhrase: () => string;
  fetchPhrases: () => Promise<void>; // Action to fetch phrases
}

const defaultPhrases = [
  // Fallback phrases if fetch fails or none exist
  "System Online",
  "Data Stream Active",
  "Awaiting Input",
];

const scrambleStoreCreator: StateCreator<ScrambleState> = (set, get) => ({
  phrases: [], // Start empty
  currentPhraseIndex: 0,
  isLoading: true,
  error: null,

  getNextPhrase: () => {
    const { phrases, currentPhraseIndex } = get();
    const phraseList = phrases.length > 0 ? phrases : defaultPhrases; // Use fetched or default
    const nextIndex = (currentPhraseIndex + 1) % phraseList.length;
    set({ currentPhraseIndex: nextIndex });
    return phraseList[currentPhraseIndex];
  },

  fetchPhrases: async () => {
    // Avoid refetching if already loaded and not errored
    if (get().phrases.length > 0 && !get().error) {
      set({ isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      // --- TODO: Replace with actual API call ---
      console.log("TODO: Fetch scrambled phrases from API for current user");
      // const fetchedPhrases = await fetchScrambledPhrasesAPI(); // API returns string[]
      // set({ phrases: fetchedPhrases.length > 0 ? fetchedPhrases : [], isLoading: false }); // Use empty array if API returns none

      // Simulate API response
      await new Promise((resolve) => setTimeout(resolve, 600));
      const simulatedPhrases = [
        "User Phrase 1",
        "User Phrase 2",
        "Simulation Active",
      ];
      set({ phrases: simulatedPhrases, isLoading: false });
      // --- End TODO ---
    } catch (err) {
      console.error("Failed to fetch scrambled phrases:", err);
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred";
      set({
        error: `Failed to load phrases: ${errorMsg}`,
        isLoading: false,
        phrases: [],
      }); // Keep phrases empty on error
    }
  },
});

const useScrambleStore = create(scrambleStoreCreator);

export default useScrambleStore;
