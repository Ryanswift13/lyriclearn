import Dexie, { type Table } from 'dexie'
import type { WordExplanation } from '../services/deepseek'

export interface VocabEntry {
  id?: number
  word: string
  sentence: string
  songName: string
  artist: string
  songId: string
  explanation: WordExplanation
  savedAt: Date
  reviewCount: number
}

export interface LibrarySong {
  id: string         // = songId, primary key
  name: string
  artist: string
  album: string
  coverUrl: string
  duration: number
  color: string
  color2: string
  addedAt: number    // timestamp ms
}

class AppDB extends Dexie {
  vocab!: Table<VocabEntry>
  library!: Table<LibrarySong>

  constructor() {
    super('musicEnglishApp')
    this.version(2).stores({ vocab: '++id, word, songId, savedAt' })
    this.version(3).stores({ library: 'id, addedAt' })
  }
}

export const db = new AppDB()
