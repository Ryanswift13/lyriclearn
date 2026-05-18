import { useState, useEffect, useMemo } from 'react'
import { explainWord } from '../services/deepseek'
import { useSettingsStore } from '../store/settingsStore'
import { useVocabNotebook } from '../hooks/useVocabNotebook'
import { usePlayerStore } from '../store/playerStore'

interface Props {
  word: string
  sentence: string
  lineTime: number
  onClose: () => void
}

function Confetti({ x, y, color }: { x: number; y: number; color: string }) {
  const pieces = useMemo(() => Array.from({ length: 18 }).map((_, i) => ({
    a: (i / 18) * Math.PI * 2 + Math.random() * 0.4,
    r: 60 + Math.random() * 80,
    s: 6 + Math.random() * 8,
    c: [color, '#f5d76e', '#ff8a8a', '#7ec4cf', '#c8a2ff'][i % 5],
    rot: Math.random() * 360,
  })), [])
  return (
    <div className="confetti-root" style={{ left: x, top: y }}>
      {pieces.map((p, i) => (
        <span key={i} className="confetti-piece" style={{
          background: p.c, width: p.s, height: p.s * 0.4,
          ['--dx' as string]: `${Math.cos(p.a) * p.r}px`,
          ['--dy' as string]: `${Math.sin(p.a) * p.r}px`,
          ['--rot' as string]: `${p.rot}deg`,
        }} />
      ))}
    </div>
  )
}

export function VocabCard({ word, sentence, lineTime, onClose }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [explanation, setExplanation] = useState<Awaited<ReturnType<typeof explainWord>> | null>(null)
  const [saved, setSaved] = useState(false)
  const [closing, setClosing] = useState(false)
  const [confetti, setConfetti] = useState<{ x: number; y: number } | null>(null)
  const { deepseekApiKey } = useSettingsStore()
  const { saveWord } = useVocabNotebook()
  const { song } = usePlayerStore()

  useEffect(() => {
    if (!deepseekApiKey) { setError('请先在设置中填写 DeepSeek API Key'); setLoading(false); return }
    explainWord(word, sentence, song?.name ?? '', song?.artist ?? '', deepseekApiKey)
      .then((exp) => { setExplanation(exp); setLoading(false) })
      .catch((e) => { setError(e.message || '请求失败'); setLoading(false) })
  }, [word, sentence])

  const close = () => { setClosing(true); setTimeout(onClose, 200) }

  const handleSave = async (e: React.MouseEvent) => {
    if (!explanation || !song || saved) return
    await saveWord({ word, sentence, songName: song.name, artist: song.artist, songId: song.id, explanation, lineTime, coverUrl: song.coverUrl, color: song.color, color2: song.color2 })
    setSaved(true)
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setConfetti({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    setTimeout(() => setConfetti(null), 1100)
  }

  return (
    <>
      <div className="vocab-backdrop" onClick={close} />
      <div className={`vocab-card ${closing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="vocab-close" onClick={close} aria-label="关闭">
          <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <div className="vocab-head">
          <div>
            <div className="vocab-word">{word}</div>
            {explanation && (
              <div className="vocab-meta">
                <span className="vocab-ipa">{explanation.ipa}</span>
                <span className="vocab-pos">{explanation.pos}</span>
                <span className="vocab-level">CEFR {explanation.cefr}</span>
              </div>
            )}
          </div>
          <button className="vocab-pron" aria-label="发音">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          </button>
        </div>

        {loading && (
          <div className="vocab-loading">
            <div className="spinner" />
            <span>AI 分析中…</span>
          </div>
        )}

        {error && <div className="vocab-error">{error}</div>}

        {explanation && (
          <>
            <div className="vocab-cn">{explanation.cn}</div>
            <div className="vocab-def">{explanation.def}</div>
            {explanation.example_en && (
              <div className="vocab-example">
                <div className="vocab-example-en">"{explanation.example_en}"</div>
                <div className="vocab-example-cn">{explanation.example_cn}</div>
              </div>
            )}
            <div className="vocab-source">
              记忆技巧：<em>{explanation.memory_tip}</em>
            </div>
            <button
              className={`vocab-save ${saved ? 'is-saved' : ''}`}
              onClick={handleSave}
              disabled={saved || !song}
            >
              {saved ? (
                <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg> 已加入生词本</>
              ) : (
                <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg> 加入生词本</>
              )}
            </button>
          </>
        )}
      </div>
      {confetti && <Confetti x={confetti.x} y={confetti.y} color={song?.color ?? '#7c3aed'} />}
    </>
  )
}
