import { useEffect, useCallback } from 'react'
import { db } from '../lib/db'
import { useLibraryStore } from '../store/libraryStore'
import type { SearchResult } from '../services/netease'

export function useLibraryInit() {
  const { setSongs } = useLibraryStore()
  useEffect(() => {
    db.library.orderBy('addedAt').reverse().toArray().then(setSongs)
  }, [])
}

export function useLibrary() {
  const { songs, addSong, removeSong } = useLibraryStore()

  const add = useCallback(async (song: SearchResult) => {
    const entry = { ...song, addedAt: Date.now() }
    await db.library.put(entry)
    addSong(entry)
  }, [addSong])

  const remove = useCallback(async (id: string) => {
    await db.library.delete(id)
    removeSong(id)
  }, [removeSong])

  const isInLibrary = useCallback((id: string) => songs.some((s) => s.id === id), [songs])

  return { songs, add, remove, isInLibrary }
}
