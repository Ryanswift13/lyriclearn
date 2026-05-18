import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { usePlayerStore } from '../store/playerStore'

type Difficulty = 'easy' | 'medium' | 'hard'
const RATIO: Record<Difficulty, number> = { easy: 0.25, medium: 0.5, hard: 1.0 }
const DIFF_LABEL: Record<Difficulty, string> = { easy: '简单 25%', medium: '普通 50%', hard: '困难 100%' }

interface Token { type: 'word' | 'sep'; text: string }
interface BlankState { value: string; status: 'pending' | 'correct' | 'wrong' }

function tokenize(text: string): Token[] {
  const out: Token[] = []
  const re = /([A-Za-z']+)|([^A-Za-z']+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m[1]) out.push({ type: 'word', text: m[1] })
    else out.push({ type: 'sep', text: m[2] })
  }
  return out
}

// Deterministic blank selection based on position
function shouldBlank(lineIdx: number, wordIdx: number, ratio: number): boolean {
  return ((lineIdx * 17 + wordIdx * 31) % 100) < ratio * 100
}

function normalize(s: string) { return s.toLowerCase().replace(/[^a-z]/g, '') }

// ── Single quiz line ─────────────────────────────────────────
interface LineProps {
  text: string
  lineIdx: number
  isCurrent: boolean
  isPast: boolean
  ratio: number
  answers: Record<string, BlankState>
  onAnswer: (key: string, value: string, correct: string) => void
  scrollRef?: (el: HTMLDivElement | null) => void
  seek: (t: number) => void
  lineTime: number
}

function QuizLine({ text, lineIdx, isCurrent, isPast, ratio, answers, onAnswer, scrollRef, seek, lineTime }: LineProps) {
  const tokens = useMemo(() => tokenize(text), [text])
  const active = isCurrent || isPast

  let wordIdx = 0
  const inputRefs: Array<HTMLInputElement | null> = []

  const focusNext = useCallback((fromWordIdx: number) => {
    for (let i = fromWordIdx + 1; i < inputRefs.length; i++) {
      if (inputRefs[i]) { inputRefs[i]!.focus(); return }
    }
  }, [])

  if (!active && !text) return null

  return (
    <div
      ref={scrollRef}
      className={`quiz-line ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''} ${!active ? 'upcoming' : ''}`}
      onClick={() => !active && seek(lineTime)}
    >
      <div className="quiz-en">
        {tokens.map((tok, i) => {
          if (tok.type === 'sep') return <span key={i} className="quiz-sep">{tok.text}</span>

          const wi = wordIdx++
          const key = `${lineIdx}-${wi}`
          const blank = shouldBlank(lineIdx, wi, ratio)

          if (!blank || !active) {
            // Regular word - dim if upcoming, normal if past/current
            return (
              <span key={i} className={`quiz-word ${!active ? 'dim' : ''} ${isPast && blank ? 'revealed' : ''}`}>
                {tok.text}
              </span>
            )
          }

          const state = answers[key]
          const myWi = wi

          return (
            <span key={i} className="quiz-blank-wrap">
              {state?.status === 'correct' ? (
                <span className="quiz-blank correct">{tok.text}</span>
              ) : state?.status === 'wrong' ? (
                <span className="quiz-blank wrong">
                  <span className="quiz-wrong-answer">{state.value || '?'}</span>
                  <span className="quiz-reveal">{tok.text}</span>
                </span>
              ) : (
                <input
                  ref={(el) => { inputRefs[myWi] = el }}
                  className="quiz-input"
                  style={{ width: `${Math.max(3, tok.text.length + 1)}ch` }}
                  value={state?.value ?? ''}
                  disabled={!isCurrent}
                  onChange={(e) => onAnswer(key, e.target.value, tok.text)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Tab') {
                      e.preventDefault()
                      // Commit current then move on
                      const val = (state?.value ?? '').trim()
                      if (val) onAnswer(key, val, tok.text)
                      focusNext(myWi)
                    }
                  }}
                />
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── Main QuizPanel ───────────────────────────────────────────
export function QuizPanel({ seek }: { seek: (t: number) => void }) {
  const { lyrics, currentLineIndex, song } = usePlayerStore()
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [answers, setAnswers] = useState<Record<string, BlankState>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const currentLineRef = useRef<HTMLDivElement | null>(null)

  // Reset when song changes
  useEffect(() => { setAnswers({}) }, [song?.id])

  // Scroll current line into center
  useEffect(() => {
    const el = currentLineRef.current
    const container = containerRef.current
    if (!el || !container) return
    const target = el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2
    container.scrollTo({ top: target, behavior: 'smooth' })
  }, [currentLineIndex])

  const ratio = RATIO[difficulty]

  const handleAnswer = useCallback((key: string, value: string, correct: string) => {
    const isCorrect = normalize(value) === normalize(correct)
    // Auto-commit when length matches or correct
    const shouldCommit = value.length >= correct.length || isCorrect
    setAnswers((prev) => ({
      ...prev,
      [key]: {
        value,
        status: shouldCommit ? (isCorrect ? 'correct' : 'wrong') : 'pending',
      },
    }))
  }, [])

  // Score
  const { correct, total } = useMemo(() => {
    let c = 0, t = 0
    Object.values(answers).forEach((s) => {
      if (s.status !== 'pending') {
        t++
        if (s.status === 'correct') c++
      }
    })
    return { correct: c, total: t }
  }, [answers])

  const pct = total > 0 ? Math.round((correct / total) * 100) : null

  if (!lyrics.length) {
    return (
      <div className="quiz-empty">
        <div style={{ fontSize: 48, opacity: 0.12, fontFamily: 'var(--font-display)' }}>♪</div>
        <p>先选一首歌，再开始练习</p>
      </div>
    )
  }

  return (
    <div className="quiz-panel">
      {/* Header: difficulty + score */}
      <div className="quiz-header">
        <div className="quiz-diff-btns">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              className={`quiz-diff-btn ${difficulty === d ? 'on' : ''}`}
              onClick={() => { setDifficulty(d); setAnswers({}) }}
            >
              {DIFF_LABEL[d]}
            </button>
          ))}
        </div>
        <div className="quiz-score">
          {pct !== null
            ? <><span className="quiz-score-num">{pct}%</span><span className="quiz-score-sub">{correct}/{total}</span></>
            : <span className="quiz-score-sub">开始答题</span>
          }
        </div>
      </div>

      {/* Lyrics with blanks */}
      <div className="quiz-scroll" ref={containerRef}>
        <div className="quiz-spacer" />
        {lyrics.map((line, i) => {
          if (!line.text) return null
          const isCurrent = i === currentLineIndex
          const isPast = i < currentLineIndex
          return (
            <QuizLine
              key={i}
              text={line.text}
              lineIdx={i}
              isCurrent={isCurrent}
              isPast={isPast}
              ratio={ratio}
              answers={answers}
              onAnswer={handleAnswer}
              lineTime={line.time}
              seek={seek}
              scrollRef={isCurrent ? (el) => { currentLineRef.current = el } : undefined}
            />
          )
        })}
        <div className="quiz-spacer" />
      </div>
    </div>
  )
}
