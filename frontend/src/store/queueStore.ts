import { create } from 'zustand'
import type { SearchResult } from '../services/netease'

export type PlayMode = 'sequential' | 'shuffle' | 'infinite'

interface QueueState {
  queue: SearchResult[]
  currentIndex: number
  playMode: PlayMode
  shuffledOrder: number[]

  setQueue: (songs: SearchResult[], startIndex?: number) => void
  addSongs: (songs: SearchResult[]) => void
  setCurrentIndex: (idx: number) => void
  setPlayMode: (mode: PlayMode) => void
  removeAt: (idx: number) => void
  clearQueue: () => void
  regenerateShuffle: () => void
}

function fisherYates(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export const useQueueStore = create<QueueState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  playMode: 'sequential',
  shuffledOrder: [],

  setQueue: (songs, startIndex = 0) => set({
    queue: songs,
    currentIndex: startIndex,
    shuffledOrder: fisherYates(songs.length),
  }),

  addSongs: (songs) => set((s) => {
    const newQueue = [...s.queue, ...songs]
    return { queue: newQueue, shuffledOrder: fisherYates(newQueue.length) }
  }),

  setCurrentIndex: (idx) => set({ currentIndex: idx }),

  setPlayMode: (mode) => {
    set({ playMode: mode })
    if (mode === 'shuffle') get().regenerateShuffle()
  },

  removeAt: (idx) => set((s) => {
    const newQueue = s.queue.filter((_, i) => i !== idx)
    let newIdx = s.currentIndex
    if (idx < s.currentIndex) newIdx--
    else if (idx === s.currentIndex) newIdx = Math.min(newIdx, newQueue.length - 1)
    return { queue: newQueue, currentIndex: newIdx, shuffledOrder: fisherYates(newQueue.length) }
  }),

  clearQueue: () => set({ queue: [], currentIndex: -1, shuffledOrder: [] }),

  regenerateShuffle: () => set((s) => ({ shuffledOrder: fisherYates(s.queue.length) })),
}))
