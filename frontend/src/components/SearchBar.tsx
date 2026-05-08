import { useState, useRef, useEffect, useCallback } from 'react'
import { searchSongs, getSongUrl, getLyrics, type SearchResult } from '../services/netease'
import { parseLRC } from '../lib/lrc-parser'
import { usePlayerStore } from '../store/playerStore'
import { formatDuration } from '../services/netease'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const { setSong, setAudioUrl, setLyrics } = usePlayerStore()

  const doSearch = useCallback(async (kw: string) => {
    if (!kw.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const res = await searchSongs(kw)
      setResults(res)
      setOpen(true)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(val), 400)
  }

  const handleSelect = async (song: SearchResult) => {
    setOpen(false)
    setQuery(song.name)
    setLoadingId(song.id)
    try {
      const [url, lyricsData] = await Promise.all([
        getSongUrl(song.id),
        getLyrics(song.id),
      ])
      setSong({
        id: song.id,
        name: song.name,
        artist: song.artist,
        album: song.album,
        coverUrl: song.coverUrl,
        duration: song.duration,
      })
      if (url) setAudioUrl(url)
      setLyrics(parseLRC(lyricsData.lrc), parseLRC(lyricsData.tlyric))
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingId(null)
    }
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={wrapperRef} className="relative" style={{ width: '100%', maxWidth: 480 }}>
      {/* 搜索输入框 */}
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-full"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="搜索歌曲、歌手..."
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'rgba(255,255,255,0.9)', caretColor: '#7c3aed' }}
        />
        {loading && (
          <div
            className="rounded-full border-2"
            style={{
              width: 14,
              height: 14,
              borderColor: 'rgba(124,58,237,0.5)',
              borderTopColor: '#7c3aed',
              animation: 'spin 0.7s linear infinite',
            }}
          />
        )}
        {loadingId && (
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>加载中…</span>
        )}
      </div>

      {/* 搜索结果下拉 */}
      {open && results.length > 0 && (
        <div
          className="absolute left-0 right-0 top-12 rounded-xl overflow-hidden z-50"
          style={{
            background: 'rgba(20,20,35,0.97)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            maxHeight: 360,
            overflowY: 'auto',
          }}
        >
          {results.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelect(s)}
              disabled={loadingId === s.id}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(124,58,237,0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {/* 封面缩略图 */}
              <div
                className="rounded overflow-hidden flex-shrink-0"
                style={{ width: 40, height: 40, background: '#1a1a2e' }}
              >
                {s.coverUrl && (
                  <img src={s.coverUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              {/* 歌曲信息 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  {s.name}
                </p>
                <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {s.artist} · {s.album}
                </p>
              </div>
              <span className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {formatDuration(s.duration)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
