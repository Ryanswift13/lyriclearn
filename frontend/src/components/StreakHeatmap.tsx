import { useActivityStore, computeStreak, dayKey } from '../store/activityStore'

const WEEKS = 13

function level(count: number): 0 | 1 | 2 | 3 {
  if (count <= 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  return 3
}

interface Props {
  wordCount: number
  dueCount: number
  onStartReview: () => void
}

export function StreakHeatmap({ wordCount, dueCount, onStartReview }: Props) {
  const records = useActivityStore((s) => s.records)
  const streak = computeStreak(records)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // Top-left cell is a Sunday so the 7-row grid aligns to weekdays.
  const start = new Date(today)
  start.setDate(start.getDate() - ((WEEKS - 1) * 7 + today.getDay()))

  const cells = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const key = dayKey(d)
    const rec = records[key]
    const count = rec ? rec.saved + rec.reviewed : 0
    return { key, future: d > today, count, lvl: level(count) }
  })

  return (
    <div className="card streak-hero">
      <div className="streak-hero-top">
        <div className="streak-flame-block">
          <div className="streak-flame">🔥</div>
          <div>
            <div className="streak-days-num">{streak}</div>
            <div className="streak-days-lbl">连续天数</div>
          </div>
        </div>
        <div className="streak-stats">
          <div className="streak-stat">
            <div className="streak-stat-num">{wordCount}</div>
            <div className="streak-stat-lbl">单词</div>
          </div>
          <div className="streak-stat">
            <div className="streak-stat-num">{dueCount}</div>
            <div className="streak-stat-lbl">待复习</div>
          </div>
          <button className="streak-review-btn" onClick={onStartReview}>
            开始复习
            {dueCount > 0 && <span className="streak-review-badge">{dueCount}</span>}
          </button>
        </div>
      </div>

      <div className="heatmap">
        {cells.map((c) => (
          <div
            key={c.key}
            className={`heatmap-cell ${c.future ? 'future' : ''}`}
            data-level={c.lvl}
            title={c.future ? '' : `${c.key} · ${c.count} 次活动`}
          />
        ))}
      </div>
      <div className="heatmap-legend">
        <span className="heatmap-legend-lbl">少</span>
        <span className="heatmap-cell" data-level={0} />
        <span className="heatmap-cell" data-level={1} />
        <span className="heatmap-cell" data-level={2} />
        <span className="heatmap-cell" data-level={3} />
        <span className="heatmap-legend-lbl">多</span>
      </div>
    </div>
  )
}
