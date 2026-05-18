import { useEffect, useRef, useMemo } from 'react'

interface Props {
  text: string
  lineIdx: number
  currentIdx: number
  currentTime: number
  lineTime: number
  nextLineTime: number
  translation?: string
  karaoke: boolean
  showTranslation: boolean
  frozen?: boolean
  onWord: (word: string, sentence: string, lineTime: number) => void
  onSeek: (time: number) => void
}

interface Token { type: 'word' | 'sep'; text: string }

function tokenize(line: string): Token[] {
  const out: Token[] = []
  const re = /([A-Za-z']+)|([^A-Za-z']+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(line)) !== null) {
    if (m[1]) out.push({ type: 'word', text: m[1] })
    else out.push({ type: 'sep', text: m[2] })
  }
  return out
}

export function LyricLine({
  text, lineIdx, currentIdx, currentTime,
  lineTime, nextLineTime, translation,
  karaoke, showTranslation, frozen, onWord, onSeek,
}: Props) {
  const isCurrent = lineIdx === currentIdx
  const isPast = lineIdx < currentIdx
  const dist = Math.abs(lineIdx - currentIdx)
  const ref = useRef<HTMLDivElement>(null)

  // Scroll current line into center of container (skip while user is browsing)
  useEffect(() => {
    if (!isCurrent || !ref.current || frozen) return
    const container = ref.current.closest('.lyrics-scroll') as HTMLElement | null
    if (!container) return
    const target = ref.current.offsetTop - container.clientHeight / 2 + ref.current.offsetHeight / 2
    container.scrollTo({ top: target, behavior: 'smooth' })
  }, [isCurrent, frozen])

  const tokens = useMemo(() => tokenize(text), [text])

  // Per-line karaoke progress (0..1)
  let progress = 0
  if (isCurrent && karaoke) {
    const dur = Math.max(0.5, nextLineTime - lineTime)
    progress = Math.max(0, Math.min(1, (currentTime - lineTime) / dur))
  } else if (isPast || (isCurrent && !karaoke)) {
    progress = 1
  }

  const wordCount = tokens.filter((t) => t.type === 'word').length
  let wIndex = 0
  let prevLit = isPast ? 1 : 0

  const blur = frozen ? 0 : (isCurrent ? 0 : Math.max(0, Math.min(4, (dist - 2) * 1.6)))
  const opacity = frozen ? 1 : (isCurrent ? 1 : Math.max(0.18, 1 - dist * 0.12))

  return (
    <div
      ref={ref}
      className={`lyric-line ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''}`}
      style={{ filter: `blur(${blur}px)`, opacity, cursor: 'pointer' }}
      onClick={() => onSeek(lineTime)}
    >
      <div className="lyric-en">
        {tokens.map((tok, i) => {
          if (tok.type === 'sep') {
            return <span key={i} className="lyric-sep" style={{ '--lit': prevLit } as React.CSSProperties}>{tok.text}</span>
          }
          const myIdx = wIndex++
          const lit = isPast ? 1 : !isCurrent ? 0 : Math.max(0, Math.min(1, progress * wordCount - myIdx))
          prevLit = lit
          return (
            <span
              key={i}
              className="word"
              style={{ '--lit': lit } as React.CSSProperties}
              onClick={(e) => { e.stopPropagation(); onWord(tok.text, text, lineTime) }}
            >
              {tok.text}
            </span>
          )
        })}
      </div>
      {showTranslation && translation && (
        <div className="lyric-cn">{translation}</div>
      )}
    </div>
  )
}
