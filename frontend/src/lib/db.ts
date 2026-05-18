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
  lineTime?: number     // seconds offset in song where the lyric was
  coverUrl?: string     // album art URL for playback
  color?: string        // gradient color 1
  color2?: string       // gradient color 2
  nextReview?: number   // timestamp ms; undefined = due immediately
  easeFactor?: number   // SM-2 ease factor, default 2.5
  lastInterval?: number // days since last review, default 1
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

// One row per calendar day the user was active. Drives the streak + heatmap.
export interface DailyActivity {
  date: string       // 'YYYY-MM-DD' (local), primary key
  saved: number      // words saved that day
  reviewed: number   // words reviewed that day
}

class AppDB extends Dexie {
  vocab!: Table<VocabEntry>
  library!: Table<LibrarySong>
  activity!: Table<DailyActivity>

  constructor() {
    super('musicEnglishApp')
    this.version(2).stores({ vocab: '++id, word, songId, savedAt' })
    this.version(3).stores({ library: 'id, addedAt' })
    this.version(4).stores({ vocab: '++id, word, songId, savedAt, nextReview' })
    this.version(5).stores({ activity: 'date' })
  }
}

export const db = new AppDB()
