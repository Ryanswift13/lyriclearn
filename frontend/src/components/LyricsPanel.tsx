import { useEffect, useRef, useMemo } from 'react'
import { usePlayerStore } from '../store/playerStore'
import { LyricLine } from './LyricLine'

function ShimmerDivider() {
  return (
    <div className="relative mx-8 my-1 overflow-hidden" style={{ height: 1 }}>
      <div
        className="shimmer-line absolute inset-0"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.6), transparent)' }}
      />
    </div>
  )
}

export function LyricsPanel() {
  const { lyrics, translationLyrics, currentLineIndex } = usePlayerStore()
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (currentLineIndex < 0) return
    lineRefs.current[currentLineIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentLineIndex])

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
        <div style={{ fontSize: 48, opacity: 0.2 }}>🎵</div>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>
          搜索并选择一首歌开始学习
        </p>
      </div>
    )
  }

  return (
    <div
      className="flex-1 overflow-y-auto py-8"
      style={{ scrollBehavior: 'smooth' }}
    >
      <div style={{ height: '30vh' }} />

      {lyrics.map((line, i) => {
        const isCurrent = i === currentLineIndex
        const translation = translationMap[i]

        return (
          <div key={i} ref={(el) => { lineRefs.current[i] = el }}>
            {isCurrent && <ShimmerDivider />}
            <LyricLine
              text={line.text}
              isCurrent={isCurrent}
              translation={isCurrent ? translation : undefined}
            />
            {isCurrent && <ShimmerDivider />}
          </div>
        )
      })}

      <div style={{ height: '30vh' }} />
    </div>
  )
}
