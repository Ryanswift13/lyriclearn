import { create } from 'zustand'
import type { LyricLine } from '../lib/lrc-parser'

export interface SongInfo {
  id: string
  name: string
  artist: string
  album: string
  coverUrl: string
  duration: number
}

interface PlayerState {
  song: SongInfo | null
  audioUrl: string | null
  lyrics: LyricLine[]
  translationLyrics: LyricLine[]
  currentLineIndex: number
  isPlaying: boolean
  playbackRate: number
  currentTime: number
  duration: number
  setSong: (song: SongInfo) => void
  setAudioUrl: (url: string) => void
  setLyrics: (lyrics: LyricLine[], translation: LyricLine[]) => void
  setCurrentLineIndex: (idx: number) => void
  setIsPlaying: (v: boolean) => void
  setPlaybackRate: (rate: number) => void
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  song: null,
  audioUrl: null,
  lyrics: [],
  translationLyrics: [],
  currentLineIndex: -1,
  isPlaying: false,
  playbackRate: 1,
  currentTime: 0,
  duration: 0,
  setSong: (song) => set({ song }),
  setAudioUrl: (audioUrl) => set({ audioUrl }),
  setLyrics: (lyrics, translationLyrics) => set({ lyrics, translationLyrics }),
  setCurrentLineIndex: (currentLineIndex) => set({ currentLineIndex }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
}))
