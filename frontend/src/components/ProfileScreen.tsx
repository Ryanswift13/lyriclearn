import { useNotebookStore } from '../store/notebookStore'
import { useVocabNotebook } from '../hooks/useVocabNotebook'

const WEEK_DATA = [22, 35, 18, 40, 28, 55, 32]
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MAX_BAR = Math.max(...WEEK_DATA)

export function ProfileScreen() {
  const { entries } = useNotebookStore()
  const { deleteWord } = useVocabNotebook()

  const totalMin = WEEK_DATA.reduce((a, b) => a + b, 0)

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
              <div className="big">{Math.floor(entries.length * 1.4)}</div>
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

        {/* Flashcards */}
        <div className="card" style={{ gridArea: 'flash' }}>
          <div className="card-eyebrow">生词本 ({entries.length})</div>
          {entries.length === 0 ? (
            <div className="flash-empty">还没有保存单词<br />点击歌词中的单词开始学习</div>
          ) : (
            <div className="flash-list">
              {entries.map((e) => (
                <div key={e.id} className="flash-item">
                  <span className="flash-word">{e.word}</span>
                  <span className="flash-cn">{e.explanation.cn}</span>
                  <button
                    onClick={() => e.id && deleteWord(e.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', fontSize: 12, flexShrink: 0 }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
