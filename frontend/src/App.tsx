import { useState, useEffect, useRef } from 'react'
import { VinylDisk } from './components/VinylDisk'
import { LyricsPanel } from './components/LyricsPanel'
import { QuizPanel } from './components/QuizPanel'
import { QueuePanel } from './components/QueuePanel'
import { VocabCard } from './components/VocabCard'
import { LibraryScreen } from './components/LibraryScreen'
import { ProfileScreen } from './components/ProfileScreen'
import { VocabScreen } from './components/VocabScreen'
import { ReviewSession } from './components/ReviewSession'
import { LoginModal } from './components/LoginModal'
import { Ambient } from './components/Ambient'
import { useAudioPlayer } from './hooks/useAudioPlayer'
import { useLyricsSync } from './hooks/useLyricsSync'
import { useVocabInit } from './hooks/useVocabNotebook'
import { useActivityInit } from './hooks/useActivity'
import { useLibraryInit } from './hooks/useLibrary'
import { usePlayerStore } from './store/playerStore'
import { useSettingsStore, type Theme } from './store/settingsStore'
import { useActivityStore, computeStreak } from './store/activityStore'
import { useQueueStore } from './store/queueStore'
import { formatDuration, logout, getSongUrl, getLyrics, getRecommendations, getSimilarSongs, type SearchResult } from './services/netease'
import { parseLRC } from './lib/lrc-parser'
import { extractPalette } from './lib/palette'
import type { VocabEntry } from './lib/db'

type View = 'player' | 'library' | 'vocab' | 'profile'
type PlayerMode = 'lyrics' | 'quiz' | 'queue'

const SPEED_OPTIONS = [0.6, 0.75, 1.0, 1.25] as const
const AUDIO_LOAD_DELAY_MS = 800
// Infinite mode: top up the queue once this few songs remain ahead of the current one.
const PREFETCH_THRESHOLD = 5
const PREFETCH_BATCH = 5

// ── Settings Modal ──────────────────────────────────────────
const QUALITY_OPTIONS: { value: import('./store/settingsStore').AudioQuality; label: string }[] = [
  { value: 'standard', label: '标准 128k' },
  { value: 'higher',   label: '较高 192k' },
  { value: 'exhigh',   label: '极高 320k' },
  { value: 'lossless', label: '无损 FLAC' },
]

function SettingsModal({ onClose }: { onClose: () => void }) {
  const { theme, karaoke, showTranslation, deepseekApiKey, audioQuality, setTheme, setKaraoke, setShowTranslation, setDeepseekApiKey, setAudioQuality } = useSettingsStore()
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
          <div className="modal-label">音频质量</div>
          <div className="theme-chips">
            {QUALITY_OPTIONS.map((q) => (
              <button key={q.value} className={`chip ${audioQuality === q.value ? 'on' : ''}`} onClick={() => setAudioQuality(q.value)}>
                {q.label}
              </button>
            ))}
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
function PlayerLeft({ seek, onPrev, onNext }: { seek: (t: number) => void; onPrev: () => void; onNext: () => void }) {
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
        size={380}
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
          <button className="ctl ctl-sm" disabled={!song} onClick={onPrev} aria-label="上一首">
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
          <button className="ctl ctl-sm" disabled={!song} onClick={onNext} aria-label="下一首">
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
  const [playerMode, setPlayerMode] = useState<PlayerMode>('lyrics')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [openWord, setOpenWord] = useState<{ word: string; sentence: string; lineTime: number } | null>(null)
  const { theme, karaoke, showTranslation, neteaseCookie, neteaseNickname, neteaseAvatarUrl, audioQuality, clearNeteaseLogin } = useSettingsStore()
  const { song, setSong, setAudioUrl, setLyrics, ambient, setAmbient } = usePlayerStore()

  const onSongEndRef = useRef<() => void>(() => {})
  const { seek } = useAudioPlayer(() => onSongEndRef.current())
  const snippetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useLyricsSync()
  useVocabInit()
  useActivityInit()
  useLibraryInit()

  // Apply theme to <html>
  useEffect(() => { document.documentElement.dataset.style = theme }, [theme])
  useEffect(() => { localStorage.setItem('verse:view', view) }, [view])

  // Derive ambient colours from the current cover; hash palette as fallback.
  useEffect(() => {
    if (!song) return
    setAmbient({ c1: song.color, c2: song.color2 })
    let cancelled = false
    extractPalette(song.coverUrl).then((p) => {
      if (!cancelled && p) setAmbient(p)
    })
    return () => { cancelled = true }
  }, [song])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--song-c1', ambient.c1)
    root.style.setProperty('--song-c2', ambient.c2)
  }, [ambient])
  useEffect(() => () => { if (snippetTimerRef.current) clearTimeout(snippetTimerRef.current) }, [])

  const handleWord = (word: string, sentence: string, lineTime: number) => setOpenWord({ word, sentence, lineTime })

  const playSongFromQueue = async (s: SearchResult, idx: number) => {
    useQueueStore.getState().setCurrentIndex(idx)
    try {
      const [url, lyricsData] = await Promise.all([getSongUrl(s.id, audioQuality), getLyrics(s.id)])
      setSong({ id: s.id, name: s.name, artist: s.artist, album: s.album, coverUrl: s.coverUrl, duration: s.duration, color: s.color, color2: s.color2 })
      if (url) setAudioUrl(url)
      setLyrics(parseLRC(lyricsData.lrc), parseLRC(lyricsData.tlyric))
    } catch (e) { console.error(e) }
  }

  // Apple Music-style autoplay: append songs similar to what's playing, so the
  // queue never runs dry and the recommendations keep changing.
  const prefetchInfinite = async () => {
    const { queue, currentIndex } = useQueueStore.getState()
    const seedId = queue[currentIndex]?.id ?? queue[queue.length - 1]?.id
    let recs = seedId ? await getSimilarSongs(seedId) : []
    if (recs.length === 0) recs = await getRecommendations()
    const fresh = recs.filter((r) => !useQueueStore.getState().queue.some((q) => q.id === r.id))
    if (fresh.length > 0) useQueueStore.getState().addSongs(fresh.slice(0, PREFETCH_BATCH))
  }

  const handleSongEnd = async () => {
    const { queue, currentIndex, playMode } = useQueueStore.getState()
    if (queue.length === 0) return

    if (playMode === 'infinite' && queue.length - currentIndex <= PREFETCH_THRESHOLD) {
      const prefetch = prefetchInfinite()
      // No song queued after the current one — must wait for the top-up before advancing.
      if (currentIndex >= queue.length - 1) await prefetch
    }

    const { queue: q, currentIndex: ci, shuffledOrder } = useQueueStore.getState()
    let nextIdx: number | null = null

    if (playMode === 'shuffle') {
      const pos = shuffledOrder.indexOf(ci)
      if (pos < shuffledOrder.length - 1) nextIdx = shuffledOrder[pos + 1]
    } else {
      if (ci < q.length - 1) nextIdx = ci + 1
    }

    if (nextIdx !== null) await playSongFromQueue(q[nextIdx], nextIdx)
  }

  onSongEndRef.current = handleSongEnd

  const handlePrev = () => {
    const { queue, currentIndex, playMode, shuffledOrder } = useQueueStore.getState()
    if (queue.length === 0) return
    let prevIdx: number
    if (playMode === 'shuffle') {
      const pos = shuffledOrder.indexOf(currentIndex)
      prevIdx = pos > 0 ? shuffledOrder[pos - 1] : shuffledOrder[shuffledOrder.length - 1]
    } else {
      prevIdx = currentIndex > 0 ? currentIndex - 1 : queue.length - 1
    }
    playSongFromQueue(queue[prevIdx], prevIdx)
  }

  const handleNext = () => {
    const { queue, currentIndex, playMode, shuffledOrder } = useQueueStore.getState()
    if (queue.length === 0) return
    let nextIdx: number
    if (playMode === 'shuffle') {
      const pos = shuffledOrder.indexOf(currentIndex)
      nextIdx = pos < shuffledOrder.length - 1 ? shuffledOrder[pos + 1] : shuffledOrder[0]
    } else {
      nextIdx = currentIndex < queue.length - 1 ? currentIndex + 1 : 0
    }
    playSongFromQueue(queue[nextIdx], nextIdx)
  }

  const handlePlayAll = async (songs: SearchResult[], startIndex = 0) => {
    useQueueStore.getState().setQueue(songs, startIndex)
    await playSongFromQueue(songs[startIndex], startIndex)
    setView('player')
  }

  const loadSongEntry = async (entry: VocabEntry) => {
    const [url, lyricsData] = await Promise.all([getSongUrl(entry.songId, audioQuality), getLyrics(entry.songId)])
    setSong({ id: entry.songId, name: entry.songName, artist: entry.artist, album: '', coverUrl: entry.coverUrl ?? '', duration: 0, color: entry.color ?? '#5b8fa8', color2: entry.color2 ?? '#3d6e85' })
    if (url) setAudioUrl(url)
    setLyrics(parseLRC(lyricsData.lrc), parseLRC(lyricsData.tlyric))
  }

  const handlePlayEntry = async (entry: VocabEntry, seekTo?: number) => {
    if (song?.id === entry.songId) {
      if (seekTo !== undefined) seek(seekTo)
      setView('player')
      return
    }
    try {
      await loadSongEntry(entry)
      setView('player')
      if (seekTo !== undefined && seekTo > 0) setTimeout(() => seek(seekTo), AUDIO_LOAD_DELAY_MS)
    } catch (e) { console.error(e) }
  }

  const handlePlaySnippet = async (entry: VocabEntry) => {
    if (snippetTimerRef.current) clearTimeout(snippetTimerRef.current)

    const playAndStop = (lineTime?: number) => {
      if (lineTime !== undefined) seek(lineTime)
      usePlayerStore.getState().setIsPlaying(true)
      snippetTimerRef.current = setTimeout(() => usePlayerStore.getState().setIsPlaying(false), 7000)
    }

    if (song?.id === entry.songId) {
      playAndStop(entry.lineTime)
      return
    }

    try {
      await loadSongEntry(entry)
      setTimeout(() => playAndStop(entry.lineTime), AUDIO_LOAD_DELAY_MS)
    } catch (e) { console.error(e) }
  }

  const handleLogout = async () => {
    if (neteaseCookie) await logout(neteaseCookie).catch(() => {})
    clearNeteaseLogin()
  }

  return (
    <div className="app">
      <Ambient />

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
          {(['player', 'library', 'vocab', 'profile'] as View[]).map((v) => (
            <button key={v} className={`navlink ${view === v ? 'on' : ''}`} onClick={() => setView(v)}>
              {v === 'player' ? 'Now Playing' : v === 'library' ? 'Library' : v === 'vocab' ? 'Vocabulary' : 'Profile'}
            </button>
          ))}
        </nav>

        <div className="top-right">
          <div className="level-pill">
            <span className="level-dot" />
            CEFR B1
          </div>
          <div className="streak-pill">
            🔥 <span className="streak-pill-num">{useActivityStore((s) => computeStreak(s.records))}</span>
          </div>
          {neteaseNickname ? (
            <button className="user-pill" onClick={handleLogout} title="点击退出登录">
              <div className="user-avatar">
                {neteaseAvatarUrl
                  ? <img src={neteaseAvatarUrl} alt="" />
                  : neteaseNickname[0]}
              </div>
              {neteaseNickname}
            </button>
          ) : (
            <button className="login-btn" onClick={() => setLoginOpen(true)}>登录网易云</button>
          )}
          <button className="settings-btn" onClick={() => setSettingsOpen(true)} aria-label="设置">⚙</button>
        </div>
      </header>

      {/* Main content — always mounted, hidden via CSS to preserve state */}
      <main className="main">
        <div className={`view-slot ${view === 'player' ? 'view-slot--on' : ''}`}>
          <div className="player">
            <PlayerLeft seek={seek} onPrev={handlePrev} onNext={handleNext} />
            <div className="player-right">
              <div className="lyrics-head">
                <div>
                  <span className="lyrics-eyebrow">
                    {playerMode === 'lyrics' ? 'Lyrics' : playerMode === 'quiz' ? 'Quiz' : 'Queue'}
                  </span>
                  <span className="lyrics-hint">
                    {playerMode === 'lyrics' ? '点击单词获取 AI 解释' : playerMode === 'quiz' ? '填写空白处的单词' : `${useQueueStore.getState().queue.length} 首歌曲`}
                  </span>
                </div>
                <div className="mode-toggle">
                  <button className={`mode-btn ${playerMode === 'lyrics' ? 'on' : ''}`} onClick={() => setPlayerMode('lyrics')}>歌词</button>
                  <button className={`mode-btn ${playerMode === 'quiz' ? 'on' : ''}`} onClick={() => setPlayerMode('quiz')}>填空练习</button>
                  <button className={`mode-btn ${playerMode === 'queue' ? 'on' : ''}`} onClick={() => setPlayerMode('queue')}>队列</button>
                </div>
              </div>
              {playerMode === 'lyrics'
                ? <LyricsPanel karaoke={karaoke} showTranslation={showTranslation} onWord={handleWord} onSeek={seek} />
                : playerMode === 'quiz'
                  ? <QuizPanel seek={seek} />
                  : <QueuePanel onPlaySong={(s, i) => { playSongFromQueue(s, i); setPlayerMode('lyrics') }} />
              }
            </div>
          </div>
        </div>
        <div className={`view-slot ${view === 'library' ? 'view-slot--on' : ''}`}>
          <LibraryScreen onSongPick={() => setView('player')} onPlayAll={handlePlayAll} />
        </div>
        <div className={`view-slot ${view === 'vocab' ? 'view-slot--on' : ''}`}>
          <VocabScreen onStartReview={() => setReviewOpen(true)} onPlayEntry={handlePlayEntry} onPlaySnippet={handlePlaySnippet} />
        </div>
        <div className={`view-slot ${view === 'profile' ? 'view-slot--on' : ''}`}>
          <ProfileScreen onOpenVocab={() => setView('vocab')} />
        </div>
      </main>

      {/* Vocab card */}
      {openWord && (
        <VocabCard word={openWord.word} sentence={openWord.sentence} lineTime={openWord.lineTime} onClose={() => setOpenWord(null)} />
      )}

      {/* Review session */}
      {reviewOpen && <ReviewSession onClose={() => setReviewOpen(false)} />}

      {/* Login modal */}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}

      {/* Settings modal */}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}

