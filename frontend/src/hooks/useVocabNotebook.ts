import { useEffect, useCallback } from 'react'
import { db, type VocabEntry } from '../lib/db'
import { useNotebookStore } from '../store/notebookStore'

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
    },
    [],
  )

  const deleteWord = useCallback(async (id: number) => {
    await db.vocab.delete(id)
    const entries = await db.vocab.orderBy('savedAt').reverse().toArray()
    setEntries(entries)
  }, [])

  return { saveWord, deleteWord }
}
