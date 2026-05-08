import { usePlayerStore } from '../store/playerStore'
import { formatDuration } from '../services/netease'

interface Props {
  onSeek: (time: number) => void
}

const SPEED_OPTIONS = [0.6, 0.75, 1.0, 1.25] as const

export function PlayerControls({ onSeek }: Props) {
  const { isPlaying, currentTime, duration, playbackRate, setIsPlaying, setPlaybackRate, song } =
    usePlayerStore()

  return (
    <div
      className="flex flex-col gap-3 px-6 py-4"
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* 进度条 */}
      <div className="flex items-center gap-3">
        <span className="text-xs tabular-nums" style={{ color: 'rgba(255,255,255,0.4)', minWidth: 36 }}>
          {formatDuration(Math.floor(currentTime))}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.5}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          style={{
            flex: 1,
            accentColor: '#7c3aed',
          }}
        />
        <span className="text-xs tabular-nums" style={{ color: 'rgba(255,255,255,0.4)', minWidth: 36, textAlign: 'right' }}>
          {formatDuration(Math.floor(duration))}
        </span>
      </div>

      {/* 控制行 */}
      <div className="flex items-center justify-between">
        {/* 播放/暂停 */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={!song}
            className="flex items-center justify-center rounded-full transition-all"
            style={{
              width: 48,
              height: 48,
              background: song ? '#7c3aed' : 'rgba(255,255,255,0.1)',
              cursor: song ? 'pointer' : 'not-allowed',
              boxShadow: song && isPlaying ? '0 0 16px rgba(124,58,237,0.5)' : 'none',
            }}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>

          {/* 歌曲信息 */}
          {song && (
            <div className="flex flex-col" style={{ maxWidth: 200 }}>
              <span
                className="text-sm font-medium truncate"
                style={{ color: 'rgba(255,255,255,0.9)' }}
              >
                {song.name}
              </span>
              <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {song.artist}
              </span>
            </div>
          )}
        </div>

        {/* 速率选择 */}
        <div className="flex items-center gap-1">
          {SPEED_OPTIONS.map((rate) => (
            <button
              key={rate}
              onClick={() => setPlaybackRate(rate)}
              className="text-xs px-2 py-1 rounded transition-all"
              style={{
                background: playbackRate === rate ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)',
                color: playbackRate === rate ? '#c4b5fd' : 'rgba(255,255,255,0.5)',
                border: playbackRate === rate ? '1px solid rgba(124,58,237,0.5)' : '1px solid transparent',
                cursor: 'pointer',
                fontWeight: playbackRate === rate ? 600 : 400,
              }}
            >
              {rate === 1 ? '1x' : `${rate}x`}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
