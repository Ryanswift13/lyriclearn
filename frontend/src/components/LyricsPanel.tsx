import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { usePlayerStore } from '../store/playerStore'
import { LyricLine } from './LyricLine'

interface Props {
  karaoke: boolean
  showTranslation: boolean
  onWord: (word: string, sentence: string, lineTime: number) => void
  onSeek: (time: number) => void
}

export function LyricsPanel({ karaoke, showTranslation, onWord, onSeek }: Props) {
  const { lyrics, translationLyrics, currentLineIndex, currentTime } = usePlayerStore()
  const [frozen, setFrozen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const handleUserScroll = useCallback(() => {
    setFrozen(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setFrozen(false), 5000)
  }, [])

  const translationMap = useMemo(() => {
    if (!translationLyrics.length) return [] as string[]
    return lyrics.map((line) => {
      let result = ''
      for (const t of translationLyrics) {
        if (t.time <= line.time) result = t.text
        else break
      }
      return result
    })
  }, [lyrics, translationLyrics])

  if (!lyrics.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div style={{ fontSize: 48, opacity: 0.15, fontFamily: 'var(--font-display)' }}>♪</div>
        <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>搜索并选择一首歌开始学习</p>
      </div>
    )
  }

  return (
    <div className="lyrics-scroll" onWheel={handleUserScroll} onTouchStart={handleUserScroll}>
      <div className="lyrics-spacer" />
      {lyrics.map((line, i) => (
        <LyricLine
          key={i}
          text={line.text}
          lineIdx={i}
          currentIdx={currentLineIndex}
          currentTime={currentTime}
          lineTime={line.time}
          nextLineTime={i < lyrics.length - 1 ? lyrics[i + 1].time : line.time + 5}
          translation={translationMap[i]}
          karaoke={karaoke}
          showTranslation={showTranslation}
          frozen={frozen}
          onWord={onWord}
          onSeek={onSeek}
        />
      ))}
      <div className="lyrics-spacer" />
    </div>
  )
}
