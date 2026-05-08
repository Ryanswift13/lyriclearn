import { useEffect } from 'react'
import { usePlayerStore } from '../store/playerStore'

export function useLyricsSync() {
  const { currentTime, lyrics, currentLineIndex, setCurrentLineIndex } = usePlayerStore()

  useEffect(() => {
    if (!lyrics.length) return

    let idx = -1
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) idx = i
      else break
    }
    if (idx !== currentLineIndex) setCurrentLineIndex(idx)
  }, [currentTime, lyrics])
}
