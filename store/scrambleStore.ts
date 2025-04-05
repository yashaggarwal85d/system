import { create, StateCreator } from "zustand";

interface ScrambleState {
  phrases: string[];
  currentPhraseIndex: number;
  isLoading: boolean;
  error: string | null;
  getNextPhrase: () => string;
  setPhrases: (phrases: string[]) => void;
}

const defaultPhrases = ["Player", "You are weak", "You lack consistency"];

const scrambleStoreCreator: StateCreator<ScrambleState> = (set, get) => ({
  phrases: [],
  currentPhraseIndex: 0,
  isLoading: true,
  error: null,
  getNextPhrase: () => {
    const { phrases, currentPhraseIndex } = get();
    const phraseList = phrases.length > 0 ? phrases : defaultPhrases;
    const nextIndex = (currentPhraseIndex + 1) % phraseList.length;
    set({ currentPhraseIndex: nextIndex });
    return phraseList[currentPhraseIndex];
  },
  setPhrases: (phrases) => set({ phrases, isLoading: false, error: null }),
});

const useScrambleStore = create(scrambleStoreCreator);

export default useScrambleStore;
