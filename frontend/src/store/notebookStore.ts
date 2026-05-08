import { create } from 'zustand'
import type { VocabEntry } from '../lib/db'

interface NotebookState {
  isOpen: boolean
  entries: VocabEntry[]
  setIsOpen: (v: boolean) => void
  setEntries: (entries: VocabEntry[]) => void
  addEntry: (entry: VocabEntry) => void
}

export const useNotebookStore = create<NotebookState>((set) => ({
  isOpen: false,
  entries: [],
  setIsOpen: (isOpen) => set({ isOpen }),
  setEntries: (entries) => set({ entries }),
  addEntry: (entry) => set((s) => ({ entries: [entry, ...s.entries] })),
}))
