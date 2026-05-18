import { useMemo } from 'react'
import { useNotebookStore } from '../store/notebookStore'

const WEEK_DATA = [22, 35, 18, 40, 28, 55, 32]
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MAX_BAR = Math.max(...WEEK_DATA)

interface Props {
  onOpenVocab: () => void
}

export function ProfileScreen({ onOpenVocab }: Props) {
  const { entries } = useNotebookStore()

  const totalMin = WEEK_DATA.reduce((a, b) => a + b, 0)

  const dueCount = useMemo(() => {
    const now = Date.now()
    return entries.filter((e) => !e.nextReview || e.nextReview <= now).length
  }, [entries])

  return (
    <div className="screen">
      <div className="profile-grid">
        {/* Hero */}
        <div className="profile-hero card">
          <div className="profile-avatar">
            <div className="profile-avatar-inner">L</div>
          </div>
          <div className="profile-name">LyricLearner</div>
          <div className="profile-sub">CEFR B1 · 正在进步中</div>
          <div className="profile-streak">
            <div className="streak-num">
              <span>🔥</span>
              {entries.length > 0 ? Math.min(entries.length * 3, 99) : 0}
            </div>
            <div className="streak-lbl">words saved</div>
          </div>
        </div>

        {/* This week */}
        <div className="card stat-card">
          <div className="card-eyebrow">本周学习</div>
          <div className="week-bars">
            {WEEK_DATA.map((m, i) => (
              <div key={i} className="week-col">
                <div className="week-bar" style={{ height: `${(m / MAX_BAR) * 100}%` }}>
                  <div className="week-bar-fill" />
                </div>
                <div className="week-day">{DAYS[i]}</div>
              </div>
            ))}
          </div>
          <div className="card-foot">
            <span className="big">{totalMin} min</span>
            <span className="muted">本周收听时长</span>
          </div>
        </div>

        {/* Lifetime */}
        <div className="card stat-card">
          <div className="card-eyebrow">累计数据</div>
          <div className="big-stats">
            <div>
              <div className="big">{Math.floor(totalMin / 60)}h</div>
              <div className="muted">总时长</div>
            </div>
            <div>
              <div className="big">12</div>
              <div className="muted">歌曲</div>
            </div>
            <div>
              <div className="big">{entries.length}</div>
              <div className="muted">生词本</div>
            </div>
            <div>
              <div className="big">{entries.reduce((a, e) => a + (e.reviewCount ?? 0), 0)}</div>
              <div className="muted">复习次数</div>
            </div>
          </div>
        </div>

        {/* Recent listening */}
        <div className="card recent-card">
          <div className="card-eyebrow">最近收听</div>
          {entries.length === 0 ? (
            <div className="recent-list">
              <div style={{ color: 'var(--ink-3)', fontSize: 13, padding: '12px 0' }}>还没有收听记录</div>
            </div>
          ) : (
            <div className="recent-list">
              {[...new Map(entries.map((e) => [e.songId, e])).values()].slice(0, 5).map((e) => (
                <div key={e.songId} className="recent-row">
                  <div>
                    <div className="recent-song">{e.songName}</div>
                    <div className="recent-artist">{e.artist}</div>
                  </div>
                  <div className="recent-stats">
                    <span className="recent-min">{entries.filter((x) => x.songId === e.songId).length} words</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vocab notebook summary — links to the full Vocabulary page */}
        <button className="card profile-vocab-card" style={{ gridArea: 'flash' }} onClick={onOpenVocab}>
          <div className="card-eyebrow">生词本</div>
          <div className="profile-vocab-main">
            <div className="profile-vocab-num">{entries.length}</div>
            <div className="profile-vocab-meta">
              <div className="muted">已收藏单词</div>
              {dueCount > 0 && <div className="profile-vocab-due">{dueCount} 个待复习</div>}
            </div>
          </div>
          {entries.length > 0 && (
            <div className="profile-vocab-chips">
              {entries.slice(0, 6).map((e) => (
                <span key={e.id} className="profile-vocab-chip">{e.word}</span>
              ))}
            </div>
          )}
          <div className="profile-vocab-link">
            {entries.length === 0 ? '去歌词里收藏单词' : '查看全部生词本 →'}
          </div>
        </button>
      </div>
    </div>
  )
}
