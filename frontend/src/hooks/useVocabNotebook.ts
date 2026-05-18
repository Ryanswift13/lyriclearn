import { useEffect, useCallback } from 'react'
import { db, type VocabEntry } from '../lib/db'
import { useNotebookStore } from '../store/notebookStore'
import { useActivityStore } from '../store/activityStore'

export function useVocabInit() {
  const { setEntries } = useNotebookStore()
  useEffect(() => {
    db.vocab.orderBy('savedAt').reverse().toArray().then(setEntries)
  }, [])
}

export function useVocabNotebook() {
  const { addEntry, setEntries } = useNotebookStore()

  const saveWord = useCallback(
    async (entry: Omit<VocabEntry, 'id' | 'savedAt' | 'reviewCount'>) => {
      const newEntry: VocabEntry = {
        ...entry,
        savedAt: new Date(),
        reviewCount: 0,
      }
      const id = await db.vocab.add(newEntry)
      addEntry({ ...newEntry, id: id as number })
      await useActivityStore.getState().bump('saved')
    },
    [],
  )

  const deleteWord = useCallback(async (id: number) => {
    await db.vocab.delete(id)
    const entries = await db.vocab.orderBy('savedAt').reverse().toArray()
    setEntries(entries)
  }, [])

  // quality: 2=认识, 1=模糊, 0=不认识 (SM-2 simplified)
  const updateReview = useCallback(async (id: number, quality: 0 | 1 | 2) => {
    const entry = await db.vocab.get(id)
    if (!entry) return
    const ef = entry.easeFactor ?? 2.5
    const li = entry.lastInterval ?? 1
    let newInterval: number
    let newEf: number
    if (quality === 2) {
      newInterval = Math.round(li * ef)
      newEf = Math.min(3.0, ef + 0.1)
    } else if (quality === 1) {
      newInterval = Math.max(1, Math.round(li * 1.2))
      newEf = Math.max(1.3, ef - 0.15)
    } else {
      newInterval = 1
      newEf = Math.max(1.3, ef - 0.2)
    }
    const nextReview = Date.now() + newInterval * 86400_000
    await db.vocab.update(id, {
      reviewCount: (entry.reviewCount ?? 0) + 1,
      nextReview,
      easeFactor: newEf,
      lastInterval: newInterval,
    })
    const entries = await db.vocab.orderBy('savedAt').reverse().toArray()
    setEntries(entries)
  }, [])

  return { saveWord, deleteWord, updateReview }
}
