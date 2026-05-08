import { useState, useEffect, useRef } from 'react'
import { VinylDisk } from './components/VinylDisk'
import { LyricsPanel } from './components/LyricsPanel'
import { VocabCard } from './components/VocabCard'
import { LibraryScreen } from './components/LibraryScreen'
import { ProfileScreen } from './components/ProfileScreen'
import { useAudioPlayer } from './hooks/useAudioPlayer'
import { useLyricsSync } from './hooks/useLyricsSync'
import { useVocabInit } from './hooks/useVocabNotebook'
import { usePlayerStore } from './store/playerStore'
import { useSettingsStore, type Theme } from './store/settingsStore'
import { useNotebookStore } from './store/notebookStore'
import { formatDuration } from './services/netease'

type View = 'player' | 'library' | 'profile'

const SPEED_OPTIONS = [0.6, 0.75, 1.0, 1.25] as const

// ── Settings Modal ──────────────────────────────────────────
function SettingsModal({ onClose }: { onClose: () => void }) {
  const { theme, karaoke, showTranslation, deepseekApiKey, setTheme, setKaraoke, setShowTranslation, setDeepseekApiKey } = useSettingsStore()
  const [key, setKey] = useState(deepseekApiKey)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">设置</div>

        <div className="modal-section">
          <div className="modal-label">外观主题</div>
          <div className="theme-chips">
            {(['calm', 'playful', 'dark'] as Theme[]).map((t) => (
              <button key={t} className={`chip ${theme === t ? 'on' : ''}`} onClick={() => setTheme(t)}>
                {t === 'calm' ? '清雅' : t === 'playful' ? '活泼' : '暗夜'}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-section">
          <div className="modal-label">歌词</div>
          <div className="modal-row">
            <span className="modal-row-label">卡拉OK点亮</span>
            <button className={`toggle ${karaoke ? 'on' : ''}`} onClick={() => setKaraoke(!karaoke)} />
          </div>
          <div className="modal-row">
            <span className="modal-row-label">显示中文翻译</span>
            <button className={`toggle ${showTranslation ? 'on' : ''}`} onClick={() => setShowTranslation(!showTranslation)} />
          </div>
        </div>

        <div className="modal-section">
          <div className="modal-label">DeepSeek API Key</div>
          <input
            className="modal-input"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onBlur={() => setDeepseekApiKey(key)}
            placeholder="sk-..."
          />
        </div>

        <button className="modal-close" onClick={onClose}>完成</button>
      </div>
    </div>
  )
}

// ── Player Left Panel ────────────────────────────────────────
function PlayerLeft({ seek }: { seek: (t: number) => void }) {
  const { song, isPlaying, currentTime, duration, playbackRate, setIsPlaying, setPlaybackRate, lyrics } = usePlayerStore()
  const barRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState(false)

  const onScrub = (e: MouseEvent | React.MouseEvent) => {
    if (!barRef.current) return
    const r = barRef.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    seek(Math.max(0, Math.min(duration, x * duration)))
  }

  useEffect(() => {
    if (!drag) return
    const move = (e: MouseEvent) => onScrub(e)
    const up = () => setDrag(false)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [drag, duration])

  const pct = duration ? (currentTime / duration) * 100 : 0

  const uniqueWords = lyrics.length
    ? new Set(lyrics.flatMap((l) => (l.text || '').toLowerCase().match(/[a-z']+/g) || [])).size
    : 0

  return (
    <div className="player-left">
      <VinylDisk
        coverUrl={song?.coverUrl ?? ''}
        isPlaying={isPlaying}
        color={song?.color ?? '#5b8fa8'}
        color2={song?.color2 ?? '#3d6e85'}
        size={300}
      />

      <div className="now-meta">
        <div className="now-eyebrow">Now Playing</div>
        <h1 className="now-title">{song?.name ?? '选择一首歌'}</h1>
        <div className="now-artist">{song ? `${song.artist} · ${song.album}` : '在 Library 搜索英文歌曲'}</div>
      </div>

      <div className="controls">
        <div
          className="scrubber"
          ref={barRef}
          onMouseDown={(e) => { setDrag(true); onScrub(e) }}
        >
          <div className="scrub-track">
            <div className="scrub-fill" style={{ width: `${pct}%` }} />
            <div className="scrub-thumb" style={{ left: `${pct}%` }} />
          </div>
          <div className="scrub-times">
            <span>{formatDuration(Math.floor(currentTime))}</span>
            <span>{formatDuration(Math.floor(duration))}</span>
          </div>
        </div>

        <div className="control-row">
          <button className="ctl ctl-sm" disabled={!song} aria-label="上一首">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="19 20 9 12 19 4 19 20" /><rect x="5" y="4" width="3" height="16" rx="1" />
            </svg>
          </button>
          <button
            className="ctl ctl-lg"
            disabled={!song}
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5 L19 12 L7 19 Z" /></svg>
            }
          </button>
          <button className="ctl ctl-sm" disabled={!song} aria-label="下一首">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 4 15 12 5 20 5 4" /><rect x="16" y="4" width="3" height="16" rx="1" />
            </svg>
          </button>
        </div>

        <div className="speed-row">
          {SPEED_OPTIONS.map((rate) => (
            <button key={rate} className={`speed-btn ${playbackRate === rate ? 'on' : ''}`} onClick={() => setPlaybackRate(rate)}>
              {rate === 1 ? '1x' : `${rate}x`}
            </button>
          ))}
        </div>
      </div>

      {song && (
        <div className="song-stats">
          <div className="stat">
            <div className="stat-num">{lyrics.filter((l) => l.text).length}</div>
            <div className="stat-lbl">lines</div>
          </div>
          <div className="stat">
            <div className="stat-num">{uniqueWords}</div>
            <div className="stat-lbl">words</div>
          </div>
          <div className="stat">
            <div className="stat-num">{formatDuration(Math.floor(duration))}</div>
            <div className="stat-lbl">duration</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main App ─────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<View>(() => (localStorage.getItem('verse:view') as View) ?? 'player')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [openWord, setOpenWord] = useState<{ word: string; sentence: string } | null>(null)
  const { theme, karaoke, showTranslation } = useSettingsStore()
  const { song } = usePlayerStore()

  const { seek } = useAudioPlayer()
  useLyricsSync()
  useVocabInit()

  // Apply theme to <html>
  useEffect(() => { document.documentElement.dataset.style = theme }, [theme])
  useEffect(() => { localStorage.setItem('verse:view', view) }, [view])

  const handleWord = (word: string, sentence: string) => setOpenWord({ word, sentence })

  return (
    <div className="app">
      {/* Top bar */}
      <header className="topbar">
        <div className="brand">
          <svg className="brand-mark" viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
            <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="3" fill="currentColor" />
            <path d="M16 4 L16 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M16 19 L16 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="brand-name">LyricLearn</span>
          <span className="brand-tag">music · english</span>
        </div>

        <nav className="topnav">
          {(['player', 'library', 'profile'] as View[]).map((v) => (
            <button key={v} className={`navlink ${view === v ? 'on' : ''}`} onClick={() => setView(v)}>
              {v === 'player' ? 'Now Playing' : v === 'library' ? 'Library' : 'Profile'}
            </button>
          ))}
        </nav>

        <div className="top-right">
          <div className="level-pill">
            <span className="level-dot" />
            CEFR B1
          </div>
          <div className="streak-pill">
            🔥 <span className="streak-pill-num">{useNotebookStore((s) => s.entries.length)}</span>
          </div>
          <button className="settings-btn" onClick={() => setSettingsOpen(true)} aria-label="设置">⚙</button>
        </div>
      </header>

      {/* Main content */}
      <main className="main">
        {view === 'player' && (
          <div className="player">
            <PlayerLeft seek={seek} />
            <div className="player-right">
              <div className="lyrics-head">
                <span className="lyrics-eyebrow">Lyrics</span>
                <span className="lyrics-hint">点击单词获取 AI 解释</span>
              </div>
              <LyricsPanel karaoke={karaoke} showTranslation={showTranslation} onWord={handleWord} />
            </div>
          </div>
        )}
        {view === 'library' && <LibraryScreen onSongPick={() => setView('player')} />}
        {view === 'profile' && <ProfileScreen />}
      </main>

      {/* Vocab card */}
      {openWord && (
        <VocabCard word={openWord.word} sentence={openWord.sentence} onClose={() => setOpenWord(null)} />
      )}

      {/* Settings modal */}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}

