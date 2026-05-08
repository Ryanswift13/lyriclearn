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
  onWord: (word: string, sentence: string) => void
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
  karaoke, showTranslation, onWord,
}: Props) {
  const isCurrent = lineIdx === currentIdx
  const isPast = lineIdx < currentIdx
  const dist = Math.abs(lineIdx - currentIdx)
  const ref = useRef<HTMLDivElement>(null)

  // Scroll current line into center of container
  useEffect(() => {
    if (!isCurrent || !ref.current) return
    const container = ref.current.closest('.lyrics-scroll') as HTMLElement | null
    if (!container) return
    const target = ref.current.offsetTop - container.clientHeight / 2 + ref.current.offsetHeight / 2
    container.scrollTo({ top: target, behavior: 'smooth' })
  }, [isCurrent])

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

  // Soft-focus blur + fade for non-current lines
  const blur = isCurrent ? 0 : Math.min(4, 0.5 + (dist - 1) * 0.9)
  const opacity = isCurrent ? 1 : Math.max(0.18, 1 - dist * 0.2)

  return (
    <div
      ref={ref}
      className={`lyric-line ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''}`}
      style={{ filter: `blur(${blur}px)`, opacity }}
    >
      <div className="lyric-en">
        {tokens.map((tok, i) => {
          if (tok.type === 'sep') return <span key={i}>{tok.text}</span>
          const myIdx = wIndex++
          const lit = isPast ? 1 : !isCurrent ? 0 : Math.max(0, Math.min(1, progress * wordCount - myIdx))
          return (
            <span
              key={i}
              className="word"
              style={{ '--lit': lit } as React.CSSProperties}
              onClick={() => onWord(tok.text, text)}
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
