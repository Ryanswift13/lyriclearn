import { create } from 'zustand'
import { db, type DailyActivity } from '../lib/db'

export function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const hasActivity = (r?: DailyActivity) => !!r && (r.saved > 0 || r.reviewed > 0)

// Consecutive days with activity, counting back from today. A still-empty today
// does not break the streak — it keeps yesterday's run until a full day lapses.
export function computeStreak(records: Record<string, DailyActivity>): number {
  const d = new Date()
  if (!hasActivity(records[dayKey(d)])) d.setDate(d.getDate() - 1)
  let streak = 0
  while (hasActivity(records[dayKey(d)])) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

interface ActivityState {
  records: Record<string, DailyActivity>
  loaded: boolean
  setRecords: (rows: DailyActivity[]) => void
  bump: (kind: 'saved' | 'reviewed') => Promise<void>
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  records: {},
  loaded: false,

  setRecords: (rows) => set({
    records: Object.fromEntries(rows.map((r) => [r.date, r])),
    loaded: true,
  }),

  bump: async (kind) => {
    const key = dayKey(new Date())
    const prev = get().records[key] ?? { date: key, saved: 0, reviewed: 0 }
    const updated: DailyActivity = { ...prev, [kind]: prev[kind] + 1 }
    await db.activity.put(updated)
    set((s) => ({ records: { ...s.records, [key]: updated } }))
  },
}))
