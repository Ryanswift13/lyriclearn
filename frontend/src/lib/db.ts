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

class AppDB extends Dexie {
  vocab!: Table<VocabEntry>

  constructor() {
    super('musicEnglishApp')
    this.version(2).stores({ vocab: '++id, word, songId, savedAt' })
  }
}

export const db = new AppDB()
