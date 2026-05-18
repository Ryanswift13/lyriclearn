import { useQueueStore, type PlayMode } from '../store/queueStore'
import type { SearchResult } from '../services/netease'

interface Props {
  onPlaySong: (s: SearchResult, idx: number) => void
}

const MODE_LABELS: Record<PlayMode, string> = {
  sequential: '→ 顺序',
  shuffle: '⇄ 随机',
  infinite: '∞ 无限',
}

export function QueuePanel({ onPlaySong }: Props) {
  const { queue, currentIndex, playMode, setPlayMode, removeAt } = useQueueStore()

  return (
    <div className="queue-panel">
      <div className="queue-mode-row">
        {(Object.keys(MODE_LABELS) as PlayMode[]).map((mode) => (
          <button
            key={mode}
            className={`queue-mode-btn ${playMode === mode ? 'on' : ''}`}
            onClick={() => setPlayMode(mode)}
          >
            {MODE_LABELS[mode]}
          </button>
        ))}
      </div>

      {queue.length === 0 ? (
        <div className="queue-empty">
          <div style={{ fontSize: 36, opacity: 0.15, fontFamily: 'var(--font-display)' }}>♪</div>
          <p>队列为空</p>
          <p style={{ fontSize: 12 }}>从 Library 点击"全部播放"或播放单曲来填充队列</p>
        </div>
      ) : (
        <div className="queue-list">
          {queue.map((s, i) => (
            <div
              key={`${s.id}-${i}`}
              className={`queue-item ${i === currentIndex ? 'current' : ''}`}
              onClick={() => onPlaySong(s, i)}
            >
              <span className="queue-item-num">
                {i === currentIndex ? '♪' : i + 1}
              </span>
              <div className="queue-item-info">
                <div className="queue-item-name">{s.name}</div>
                <div className="queue-item-artist">{s.artist}</div>
              </div>
              <button
                className="queue-item-remove"
                onClick={(e) => { e.stopPropagation(); removeAt(i) }}
                aria-label="从队列移除"
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
