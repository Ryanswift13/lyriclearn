import { create } from 'zustand'
import type { LibrarySong } from '../lib/db'

interface LibraryState {
  songs: LibrarySong[]
  setSongs: (songs: LibrarySong[]) => void
  addSong: (song: LibrarySong) => void
  removeSong: (id: string) => void
}

export const useLibraryStore = create<LibraryState>((set) => ({
  songs: [],
  setSongs: (songs) => set({ songs }),
  addSong: (song) => set((s) => ({ songs: [song, ...s.songs] })),
  removeSong: (id) => set((s) => ({ songs: s.songs.filter((x) => x.id !== id) })),
}))
