import Dexie, { type Table } from 'dexie'

export interface VocabEntry {
  id?: number
  word: string
  sentence: string
  songName: string
  artist: string
  songId: string
  explanation: {
    definition: string
    example: string
    culture: string
    memory_tip: string
  }
  savedAt: Date
  reviewCount: number
}

class AppDB extends Dexie {
  vocab!: Table<VocabEntry>

  constructor() {
    super('musicEnglishApp')
    this.version(1).stores({
      vocab: '++id, word, songId, savedAt',
    })
  }
}

export const db = new AppDB()
