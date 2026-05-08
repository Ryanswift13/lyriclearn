import { useState, useRef, useEffect, useCallback } from 'react'
import { searchSongs, getSongUrl, getLyrics, formatDuration, type SearchResult } from '../services/netease'
import { parseLRC } from '../lib/lrc-parser'
import { usePlayerStore } from '../store/playerStore'

interface Props {
  onSongPick: () => void
}

export function LibraryScreen({ onSongPick }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { song: currentSong, setSong, setAudioUrl, setLyrics } = usePlayerStore()

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const doSearch = useCallback(async (kw: string) => {
    if (!kw.trim()) { setResults([]); return }
    setLoading(true)
    try { setResults(await searchSongs(kw)) }
    catch { setResults([]) }
    finally { setLoading(false) }
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(val), 400)
  }

  const handlePick = async (s: SearchResult) => {
    setLoadingId(s.id)
    try {
      const [url, lyricsData] = await Promise.all([getSongUrl(s.id), getLyrics(s.id)])
      setSong({ id: s.id, name: s.name, artist: s.artist, album: s.album, coverUrl: s.coverUrl, duration: s.duration, color: s.color, color2: s.color2 })
      if (url) setAudioUrl(url)
      setLyrics(parseLRC(lyricsData.lrc), parseLRC(lyricsData.tlyric))
      onSongPick()
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="screen">
      <div className="screen-head">
        <div>
          <div className="screen-eyebrow">Library</div>
          <h2 className="screen-title">Songs to learn</h2>
        </div>
      </div>

      <div className="lib-search">
        <div className="lib-search-inner">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--ink-3)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={handleInput}
            placeholder="搜索英文歌曲、歌手…"
          />
          {loading && <div className="spinner" />}
        </div>
      </div>

      {results.length > 0 && (
        <div className="lib-grid">
          {results.map((s) => {
            const isPlaying = s.id === currentSong?.id
            const isLoading = loadingId === s.id
            return (
              <button key={s.id} className={`lib-card ${isPlaying ? 'playing' : ''}`} onClick={() => handlePick(s)}>
                <div
                  className="lib-cover"
                  style={{ background: `radial-gradient(circle at 30% 30%, ${s.color} 0%, ${s.color2} 75%, #1a1a1a 100%)` }}
                >
                  {s.coverUrl && <img src={s.coverUrl} alt="" />}
                  <div className="lib-cover-grooves" />
                  {isPlaying && <div className="lib-playing-badge">Playing</div>}
                  {isLoading && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: '50%', zIndex: 4 }}>
                      <div className="spinner" />
                    </div>
                  )}
                </div>
                <div className="lib-meta">
                  <div className="lib-title">{s.name}</div>
                  <div className="lib-artist">{s.artist}</div>
                  <div className="lib-tags">
                    <span className="tag">{s.album}</span>
                    <span className="tag">{formatDuration(s.duration)}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {!loading && results.length === 0 && query.trim() && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-3)', fontSize: 14 }}>
          没有找到相关歌曲
        </div>
      )}

      {!query.trim() && (
        <div style={{ textAlign: 'center', padding: '56px 0' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 64, opacity: 0.12 }}>♪</div>
          <p style={{ color: 'var(--ink-3)', fontSize: 14, marginTop: 12 }}>输入歌名或歌手开始搜索</p>
        </div>
      )}
    </div>
  )
}
