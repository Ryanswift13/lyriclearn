import { useState, useMemo } from 'react'
import { useNotebookStore } from '../store/notebookStore'
import { useVocabNotebook } from '../hooks/useVocabNotebook'
import { useActivityStore } from '../store/activityStore'
import type { VocabEntry } from '../lib/db'

interface Props { onClose: () => void }

export function ReviewSession({ onClose }: Props) {
  const { entries } = useNotebookStore()
  const { updateReview } = useVocabNotebook()

  // Cards due: nextReview <= now, or never reviewed
  const due = useMemo(() => {
    const now = Date.now()
    return entries.filter((e) => !e.nextReview || e.nextReview <= now)
  }, [entries])

  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)
  const [results, setResults] = useState<{ know: number; fuzzy: number; unknown: number }>({ know: 0, fuzzy: 0, unknown: 0 })

  const card: VocabEntry | undefined = due[idx]
  const total = due.length

  const advance = () => {
    setFlipped(false)
    if (idx + 1 >= total) setDone(true)
    else setIdx(idx + 1)
  }

  const handle = async (quality: 0 | 1 | 2) => {
    if (!card?.id) return
    await updateReview(card.id, quality)
    await useActivityStore.getState().bump('reviewed')
    setResults((r) => ({
      know: r.know + (quality === 2 ? 1 : 0),
      fuzzy: r.fuzzy + (quality === 1 ? 1 : 0),
      unknown: r.unknown + (quality === 0 ? 1 : 0),
    }))
    advance()
  }

  if (total === 0) {
    return (
      <div className="review-backdrop" onClick={onClose}>
        <div className="review-modal" onClick={(e) => e.stopPropagation()}>
          <div className="review-done-icon">🎉</div>
          <div className="review-done-title">今日无待复习单词</div>
          <div className="review-done-sub">所有单词都已在计划内，继续听歌学习吧！</div>
          <button className="review-close-btn" onClick={onClose}>关闭</button>
        </div>
      </div>
    )
  }

  if (done) {
    const pct = Math.round((results.know / total) * 100)
    return (
      <div className="review-backdrop" onClick={onClose}>
        <div className="review-modal" onClick={(e) => e.stopPropagation()}>
          <div className="review-done-icon">{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📖'}</div>
          <div className="review-done-title">复习完成！</div>
          <div className="review-score-row">
            <div className="review-score-item know"><span>{results.know}</span>认识</div>
            <div className="review-score-item fuzzy"><span>{results.fuzzy}</span>模糊</div>
            <div className="review-score-item unknown"><span>{results.unknown}</span>不认识</div>
          </div>
          <div className="review-done-sub">正确率 {pct}%，复习 {total} 个单词</div>
          <button className="review-close-btn" onClick={onClose}>完成</button>
        </div>
      </div>
    )
  }

  const ex = card?.explanation

  return (
    <div className="review-backdrop" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        {/* Progress */}
        <div className="review-progress">
          <div className="review-progress-bar" style={{ width: `${(idx / total) * 100}%` }} />
        </div>
        <div className="review-counter">{idx + 1} / {total}</div>

        {/* Card */}
        <div className={`review-card ${flipped ? 'flipped' : ''}`} onClick={() => !flipped && setFlipped(true)}>
          {/* Front */}
          <div className="review-face front">
            <div className="review-word">{card?.word}</div>
            {ex?.ipa && <div className="review-ipa">{ex.ipa}</div>}
            <div className="review-sentence">"{card?.sentence}"</div>
            <div className="review-source">{card?.songName} · {card?.artist}</div>
            <div className="review-flip-hint">点击翻转查看释义</div>
          </div>

          {/* Back */}
          <div className="review-face back">
            <div className="review-word">{card?.word}</div>
            {ex?.pos && ex?.cefr && (
              <div className="review-tags">
                <span className="review-tag">{ex.pos}</span>
                <span className="review-tag cefr">{ex.cefr}</span>
              </div>
            )}
            <div className="review-cn">{ex?.cn}</div>
            {ex?.def && <div className="review-def">{ex.def}</div>}
            {ex?.memory_tip && (
              <div className="review-tip">💡 {ex.memory_tip}</div>
            )}
          </div>
        </div>

        {/* Buttons — only visible after flip */}
        {flipped ? (
          <div className="review-btns">
            <button className="review-btn unknown" onClick={() => handle(0)}>
              <span className="review-btn-icon">✗</span>不认识
            </button>
            <button className="review-btn fuzzy" onClick={() => handle(1)}>
              <span className="review-btn-icon">△</span>模糊
            </button>
            <button className="review-btn know" onClick={() => handle(2)}>
              <span className="review-btn-icon">✓</span>认识
            </button>
          </div>
        ) : (
          <div className="review-btns-hint">翻转后选择掌握程度</div>
        )}

        <button className="review-exit" onClick={onClose}>退出复习</button>
      </div>
    </div>
  )
}
