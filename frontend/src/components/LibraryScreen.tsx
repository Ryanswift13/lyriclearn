import { useState, useRef, useEffect, useCallback } from 'react'
import {
  searchSongs, searchAlbums, getAlbumSongs, getRecommendations,
  getUserPlaylists, getPlaylistSongs, getSearchSuggestions,
  getSongUrl, getLyrics, formatDuration,
  type SearchResult, type AlbumResult, type PlaylistInfo,
} from '../services/netease'
import { parseLRC } from '../lib/lrc-parser'
import { usePlayerStore } from '../store/playerStore'
import { useSettingsStore } from '../store/settingsStore'
import { useLibrary } from '../hooks/useLibrary'
import { useQueueStore } from '../store/queueStore'

type LibTab = 'songs' | 'albums' | 'saved'

interface Props {
  onSongPick: () => void
  onPlayAll?: (songs: SearchResult[], startIndex?: number) => void
}

// ── Song card ────────────────────────────────────────────────
function SongCard({ song, isPlaying, isLoading, inLibrary, onPlay, onToggleLib }: {
  song: SearchResult; isPlaying: boolean; isLoading: boolean
  inLibrary: boolean; onPlay: () => void; onToggleLib: (e: React.MouseEvent) => void
}) {
  return (
    <button className={`lib-card ${isPlaying ? 'playing' : ''}`} onClick={onPlay}>
      <div className="lib-cover" style={{ background: `radial-gradient(circle at 30% 30%, ${song.color} 0%, ${song.color2} 75%, #1a1a1a 100%)` }}>
        {song.coverUrl && <img src={song.coverUrl} alt="" />}
        <div className="lib-cover-grooves" />
        {isPlaying && <div className="lib-playing-badge">Playing</div>}
        {isLoading && <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.4)',borderRadius:'50%',zIndex:4 }}><div className="spinner" /></div>}
      </div>
      <div className="lib-meta">
        <div className="lib-title">{song.name}</div>
        <div className="lib-artist">{song.artist}</div>
        <div className="lib-tags"><span className="tag">{song.album}</span><span className="tag">{formatDuration(song.duration)}</span></div>
      </div>
      <button className={`lib-save-btn ${inLibrary ? 'saved' : ''}`} onClick={onToggleLib} title={inLibrary ? '从收藏中移除' : '添加到收藏'}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill={inLibrary ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    </button>
  )
}

// ── Playlist card (square cover, not circular) ───────────────
function PlaylistCard({ pl, isOpen, onClick }: { pl: PlaylistInfo; isOpen: boolean; onClick: () => void }) {
  return (
    <button className={`lib-card playlist-card ${isOpen ? 'open' : ''}`} onClick={onClick}>
      <div className="playlist-cover" style={{ background: `linear-gradient(135deg, ${pl.color} 0%, ${pl.color2} 100%)` }}>
        {pl.coverUrl && <img src={pl.coverUrl} alt="" />}
        <div className="playlist-track-count">{pl.trackCount} 首</div>
      </div>
      <div className="lib-meta">
        <div className="lib-title">{pl.name}</div>
      </div>
    </button>
  )
}

// ── Song list row (used inside playlist/album detail) ────────
function SongRow({ song, idx, isLoading, inLibrary, onPlay, onToggleLib }: {
  song: SearchResult; idx: number; isLoading: boolean
  inLibrary: boolean; onPlay: () => void; onToggleLib: (e: React.MouseEvent) => void
}) {
  return (
    <div className="album-song-row">
      <span className="album-song-num">{idx + 1}</span>
      <div className="album-song-info" onClick={onPlay} style={{ cursor: 'pointer' }}>
        <div className="album-song-name">{song.name}</div>
        <div className="album-song-dur">{song.artist} · {formatDuration(song.duration)}</div>
      </div>
      <button className={`lib-save-btn ${inLibrary ? 'saved' : ''}`} onClick={onToggleLib} style={{ position:'static',opacity:1,background:'transparent',color: inLibrary ? '#ff5d8f' : 'var(--ink-4)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill={inLibrary ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
      {isLoading && <div className="spinner" style={{ marginLeft: 4 }} />}
    </div>
  )
}

// ── Detail panel (shared by album & playlist) ────────────────
function DetailPanel({ title, subtitle, songs, loadingId, isInLibrary, onPlay, onToggleLib, onClose, onPlayAll }: {
  title: string; subtitle?: string; songs: SearchResult[]; loadingId: string | null
  isInLibrary: (id: string) => boolean
  onPlay: (s: SearchResult) => void
  onToggleLib: (e: React.MouseEvent, s: SearchResult) => void
  onClose: () => void
  onPlayAll?: (songs: SearchResult[]) => void
}) {
  return (
    <div className="album-detail">
      <div className="album-detail-head">
        <div>
          <div className="album-detail-title">{title}</div>
          {subtitle && <div className="album-detail-artist">{subtitle}</div>}
        </div>
        <div className="album-detail-actions">
          {onPlayAll && songs.length > 0 && (
            <button className="play-all-btn" onClick={() => onPlayAll(songs)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z" /></svg>
              全部播放
            </button>
          )}
          <button className="album-detail-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>
      </div>
      <div className="album-song-list">
        {songs.map((s, i) => (
          <SongRow key={s.id} song={s} idx={i} isLoading={loadingId === s.id}
            inLibrary={isInLibrary(s.id)} onPlay={() => onPlay(s)} onToggleLib={(e) => onToggleLib(e, s)} />
        ))}
      </div>
    </div>
  )
}

export function LibraryScreen({ onSongPick, onPlayAll }: Props) {
  const [tab, setTab] = useState<LibTab>('songs')
  const [query, setQuery] = useState('')
  const [songResults, setSongResults] = useState<SearchResult[]>([])
  const [albumResults, setAlbumResults] = useState<AlbumResult[]>([])
  const [recs, setRecs] = useState<SearchResult[]>([])
  const [recsLoading, setRecsLoading] = useState(false)
  // Albums tab
  const [openAlbum, setOpenAlbum] = useState<{ id: string; name: string; artist: string; songs: SearchResult[] } | null>(null)
  const [loadingAlbumId, setLoadingAlbumId] = useState<string | null>(null)
  // User playlists
  const [userPlaylists, setUserPlaylists] = useState<PlaylistInfo[]>([])
  const [likedPlaylist, setLikedPlaylist] = useState<PlaylistInfo | null>(null)
  const [playlistsLoaded, setPlaylistsLoaded] = useState(false)
  const [openPlaylist, setOpenPlaylist] = useState<{ id: string; name: string; songs: SearchResult[] } | null>(null)
  const [loadingPlaylistId, setLoadingPlaylistId] = useState<string | null>(null)
  // Liked songs (红心)
  const [likedSongs, setLikedSongs] = useState<SearchResult[]>([])
  const [likedLoaded, setLikedLoaded] = useState(false)
  const [likedLoading, setLikedLoading] = useState(false)
  const [likedExpanded, setLikedExpanded] = useState(false)
  // General
  const [loading, setLoading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [searchFocused, setSearchFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('verse:search-history') ?? '[]') }
    catch { return [] }
  })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suggTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { song: currentSong, setSong, setAudioUrl, setLyrics } = usePlayerStore()
  const { neteaseCookie, neteaseUid, audioQuality } = useSettingsStore()
  const { songs: libSongs, add, remove, isInLibrary } = useLibrary()

  // ── Load recs on mount ──────────────────────────────────────
  useEffect(() => {
    setRecsLoading(true)
    getRecommendations().then(setRecs).catch(() => {}).finally(() => setRecsLoading(false))
  }, [])

  // ── Load user playlists when Albums tab + logged in ─────────
  useEffect(() => {
    if (tab !== 'albums' || !neteaseCookie || !neteaseUid || playlistsLoaded) return
    getUserPlaylists(neteaseUid).then(({ liked, others }) => {
      setLikedPlaylist(liked)
      setUserPlaylists(others)
      setPlaylistsLoaded(true)
    }).catch(() => {})
  }, [tab, neteaseCookie, neteaseUid, playlistsLoaded])

  // ── Load liked songs when Saved tab + logged in ─────────────
  useEffect(() => {
    if (tab !== 'saved' || !likedPlaylist || likedLoaded || likedLoading) return
    setLikedLoading(true)
    getPlaylistSongs(likedPlaylist.id, 200).then((songs) => {
      setLikedSongs(songs)
      setLikedLoaded(true)
    }).catch(() => {}).finally(() => setLikedLoading(false))
  }, [tab, likedPlaylist, likedLoaded, likedLoading])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (suggTimerRef.current) clearTimeout(suggTimerRef.current)
  }, [])

  const saveToHistory = useCallback((term: string) => {
    const t = term.trim()
    if (!t) return
    setSearchHistory(prev => {
      const next = [t, ...prev.filter(h => h !== t)].slice(0, 10)
      localStorage.setItem('verse:search-history', JSON.stringify(next))
      return next
    })
  }, [])

  const deleteFromHistory = useCallback((term: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSearchHistory(prev => {
      const next = prev.filter(h => h !== term)
      localStorage.setItem('verse:search-history', JSON.stringify(next))
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setSearchHistory([])
    localStorage.removeItem('verse:search-history')
  }, [])

  const doSearch = useCallback(async (kw: string) => {
    if (!kw.trim()) { setSongResults([]); setAlbumResults([]); return }
    setLoading(true)
    try {
      if (tab === 'songs') setSongResults(await searchSongs(kw))
      else if (tab === 'albums') setAlbumResults(await searchAlbums(kw))
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [tab, saveToHistory])

  const handleSelectSuggestion = useCallback((term: string) => {
    setQuery(term)
    setSearchFocused(false)
    setSuggestions([])
    saveToHistory(term)
    doSearch(term)
  }, [doSearch, saveToHistory])

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      setSearchFocused(false)
      saveToHistory(query.trim())
      doSearch(query.trim())
    } else if (e.key === 'Escape') {
      setSearchFocused(false)
    }
  }, [query, doSearch, saveToHistory])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(val), 400)
    if (suggTimerRef.current) clearTimeout(suggTimerRef.current)
    if (val.trim()) {
      suggTimerRef.current = setTimeout(async () => {
        const results = await getSearchSuggestions(val)
        setSuggestions(results)
      }, 300)
    } else {
      setSuggestions([])
    }
  }

  const handleTabChange = (t: LibTab) => {
    setTab(t); setQuery(''); setSongResults([]); setAlbumResults([]); setOpenAlbum(null); setOpenPlaylist(null)
  }

  useEffect(() => { if (query.trim()) doSearch(query) }, [tab])

  const playSong = async (s: SearchResult) => {
    setLoadingId(s.id)
    try {
      const [url, lyricsData] = await Promise.all([getSongUrl(s.id, audioQuality), getLyrics(s.id)])
      setSong({ id: s.id, name: s.name, artist: s.artist, album: s.album, coverUrl: s.coverUrl, duration: s.duration, color: s.color, color2: s.color2 })
      if (url) setAudioUrl(url)
      setLyrics(parseLRC(lyricsData.lrc), parseLRC(lyricsData.tlyric))
      useQueueStore.getState().setQueue([s], 0)
      onSongPick()
    } catch (e) { console.error(e) }
    finally { setLoadingId(null) }
  }

  const toggleLib = async (e: React.MouseEvent, s: SearchResult) => {
    e.stopPropagation()
    if (isInLibrary(s.id)) await remove(s.id)
    else await add(s)
  }

  const handleAlbumClick = async (album: AlbumResult) => {
    if (openAlbum?.id === album.id) { setOpenAlbum(null); return }
    setLoadingAlbumId(album.id)
    try {
      const detail = await getAlbumSongs(album.id)
      setOpenAlbum({ id: album.id, ...detail })
    } catch { /* ignore */ }
    finally { setLoadingAlbumId(null) }
  }

  const handlePlaylistClick = async (pl: PlaylistInfo) => {
    if (openPlaylist?.id === pl.id) { setOpenPlaylist(null); return }
    setLoadingPlaylistId(pl.id)
    try {
      const songs = await getPlaylistSongs(pl.id)
      setOpenPlaylist({ id: pl.id, name: pl.name, songs })
    } catch { /* ignore */ }
    finally { setLoadingPlaylistId(null) }
  }

  const tabs: { id: LibTab; label: string }[] = [
    { id: 'songs', label: '歌曲' },
    { id: 'albums', label: '专辑' },
    { id: 'saved', label: `收藏${libSongs.length ? ` (${libSongs.length})` : ''}` },
  ]

  const historyMatches = query.trim()
    ? searchHistory.filter(h => h.toLowerCase().includes(query.toLowerCase()))
    : []
  const filteredSuggestions = suggestions.filter(s => !historyMatches.includes(s))
  const showDropdown = searchFocused && (
    (!query.trim() && searchHistory.length > 0) ||
    (!!query.trim() && (historyMatches.length > 0 || filteredSuggestions.length > 0))
  )

  const searchDropdown = showDropdown ? (
    <div className="lib-search-dropdown" onMouseDown={(e) => e.preventDefault()}>
      {!query.trim() && (
        <div className="search-dropdown-header">
          <span className="search-dropdown-label">最近搜索</span>
          <button className="search-dropdown-clear" onClick={clearHistory}>清除全部</button>
        </div>
      )}
      {(!query.trim() ? searchHistory : historyMatches).map(h => (
        <div key={h} className="search-dropdown-item" onClick={() => handleSelectSuggestion(h)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="search-dropdown-icon">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="search-dropdown-text">{h}</span>
          <button className="search-dropdown-del" onClick={(e) => deleteFromHistory(h, e)}>✕</button>
        </div>
      ))}
      {filteredSuggestions.map(s => (
        <div key={s} className="search-dropdown-item" onClick={() => handleSelectSuggestion(s)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="search-dropdown-icon">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="search-dropdown-text">{s}</span>
        </div>
      ))}
    </div>
  ) : null

  return (
    <div className="screen">
      <div className="screen-head">
        <div>
          <div className="screen-eyebrow">Library</div>
          <h2 className="screen-title">Songs to learn</h2>
        </div>
        <div className="lib-tabs">
          {tabs.map((t) => (
            <button key={t.id} className={`chip ${tab === t.id ? 'on' : ''}`} onClick={() => handleTabChange(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* ── Songs tab ── */}
      {tab === 'songs' && (
        <>
          <div className="lib-search">
            <div className="lib-search-inner">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--ink-3)', flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="text" value={query} onChange={handleInput} placeholder="搜索歌曲、歌手…"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                onKeyDown={handleSearchKeyDown}
              />
              {loading && <div className="spinner" />}
            </div>
            {searchDropdown}
          </div>
          {!query.trim() && <div className="lib-section-label">{recsLoading ? '加载推荐中…' : '欧美热歌推荐'}</div>}
          {!query.trim() && recsLoading && <div style={{ display:'flex',justifyContent:'center',padding:'48px 0' }}><div className="spinner" /></div>}
          {(query.trim() ? songResults : recs).length > 0 && (
            <div className="lib-grid">
              {(query.trim() ? songResults : recs).map((s) => (
                <SongCard key={s.id} song={s} isPlaying={s.id === currentSong?.id} isLoading={loadingId === s.id}
                  inLibrary={isInLibrary(s.id)} onPlay={() => playSong(s)} onToggleLib={(e) => toggleLib(e, s)} />
              ))}
            </div>
          )}
          {!loading && !recsLoading && (query.trim() ? songResults : recs).length === 0 && query.trim() && (
            <div className="lib-empty">没有找到相关歌曲</div>
          )}
          {!query.trim() && !recsLoading && recs.length === 0 && (
            <div style={{ textAlign:'center',padding:'56px 0' }}>
              <div style={{ fontFamily:'var(--font-display)',fontSize:64,opacity:0.12 }}>♪</div>
              <p style={{ color:'var(--ink-3)',fontSize:14,marginTop:12 }}>输入歌名或歌手开始搜索</p>
            </div>
          )}
        </>
      )}

      {/* ── Albums tab ── */}
      {tab === 'albums' && (
        <>
          {/* 我的歌单 section */}
          {neteaseCookie && neteaseUid && (
            <div className="lib-user-section">
              <div className="lib-section-label">我的歌单</div>
              {!playlistsLoaded ? (
                <div style={{ display:'flex',gap:10,alignItems:'center',marginBottom:20,color:'var(--ink-3)',fontSize:13 }}>
                  <div className="spinner" /><span>加载歌单中…</span>
                </div>
              ) : userPlaylists.length === 0 ? (
                <div className="lib-empty" style={{ padding:'12px 0' }}>暂无创建的歌单</div>
              ) : (
                <>
                  <div className="lib-grid playlist-grid">
                    {userPlaylists.map((pl) => (
                      <div key={pl.id} className="album-card-wrap">
                        <PlaylistCard pl={pl} isOpen={openPlaylist?.id === pl.id} onClick={() => handlePlaylistClick(pl)} />
                        {loadingPlaylistId === pl.id && <div className="album-detail-loading"><div className="spinner" /></div>}
                      </div>
                    ))}
                  </div>
                  {openPlaylist && (
                    <DetailPanel title={openPlaylist.name} songs={openPlaylist.songs} loadingId={loadingId}
                      isInLibrary={isInLibrary} onPlay={playSong} onToggleLib={toggleLib} onClose={() => setOpenPlaylist(null)}
                      onPlayAll={onPlayAll ? (songs) => onPlayAll(songs) : undefined} />
                  )}
                </>
              )}
              <div className="lib-divider" />
            </div>
          )}
          {!neteaseCookie && (
            <div className="lib-login-hint">登录网易云账号后可查看我的歌单</div>
          )}

          {/* Album search */}
          <div className="lib-section-label">搜索专辑</div>
          <div className="lib-search">
            <div className="lib-search-inner">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--ink-3)', flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="text" value={query} onChange={handleInput} placeholder="搜索专辑名称…"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                onKeyDown={handleSearchKeyDown}
              />
              {loading && <div className="spinner" />}
            </div>
            {searchDropdown}
          </div>
          {albumResults.length > 0 && (
            <div className="lib-grid">
              {albumResults.map((a) => (
                <div key={a.id} className="album-card-wrap">
                  <button className={`lib-card ${openAlbum?.id === a.id ? 'open' : ''}`} onClick={() => handleAlbumClick(a)}>
                    <div className="lib-cover" style={{ background: `radial-gradient(circle at 30% 30%, ${a.color} 0%, ${a.color2} 75%, #1a1a1a 100%)` }}>
                      {a.coverUrl && <img src={a.coverUrl} alt="" />}
                      <div className="lib-cover-grooves" />
                    </div>
                    <div className="lib-meta">
                      <div className="lib-title">{a.name}</div>
                      <div className="lib-artist">{a.artist}</div>
                      <div className="lib-tags"><span className="tag">{a.size} 首</span></div>
                    </div>
                  </button>
                  {loadingAlbumId === a.id && <div className="album-detail-loading"><div className="spinner" /></div>}
                </div>
              ))}
            </div>
          )}
          {!loading && albumResults.length === 0 && query.trim() && <div className="lib-empty">没有找到相关专辑</div>}
          {!query.trim() && albumResults.length === 0 && (
            <div style={{ textAlign:'center',padding:'32px 0' }}>
              <div style={{ fontFamily:'var(--font-display)',fontSize:48,opacity:0.12 }}>◎</div>
              <p style={{ color:'var(--ink-3)',fontSize:14,marginTop:10 }}>输入专辑名称开始搜索</p>
            </div>
          )}
          {openAlbum && (
            <DetailPanel title={openAlbum.name} subtitle={openAlbum.artist} songs={openAlbum.songs}
              loadingId={loadingId} isInLibrary={isInLibrary} onPlay={playSong} onToggleLib={toggleLib}
              onClose={() => setOpenAlbum(null)}
              onPlayAll={onPlayAll ? (songs) => onPlayAll(songs) : undefined} />
          )}
        </>
      )}

      {/* ── Saved tab ── */}
      {tab === 'saved' && (
        <>
          {/* 网易云红心 */}
          {neteaseCookie && (
            <div className="lib-user-section">
              <div className="lib-section-label" style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                <span><span style={{ color:'#ff5d8f' }}>♥</span> 网易云红心歌曲{likedSongs.length > 0 && <span style={{ marginLeft:6,color:'var(--ink-4)' }}>({likedSongs.length})</span>}</span>
                {likedSongs.length > 0 && onPlayAll && (
                  <button className="play-all-btn" onClick={() => onPlayAll(likedSongs)}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z" /></svg>
                    全部播放
                  </button>
                )}
              </div>
              {likedLoading ? (
                <div style={{ display:'flex',gap:10,alignItems:'center',marginBottom:20,color:'var(--ink-3)',fontSize:13 }}>
                  <div className="spinner" /><span>加载红心歌曲中…</span>
                </div>
              ) : likedLoaded && likedSongs.length === 0 ? (
                <div className="lib-empty" style={{ padding:'12px 0' }}>还没有红心歌曲</div>
              ) : likedLoaded && likedSongs.length > 0 ? (
                <>
                  <div style={{ position: 'relative', overflow: 'hidden', maxHeight: likedExpanded ? undefined : 560 }}>
                    <div className="lib-grid">
                      {likedSongs.map((s) => (
                        <SongCard key={s.id} song={s} isPlaying={s.id === currentSong?.id} isLoading={loadingId === s.id}
                          inLibrary={isInLibrary(s.id)} onPlay={() => playSong(s)} onToggleLib={(e) => toggleLib(e, s)} />
                      ))}
                    </div>
                    {!likedExpanded && (
                      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:100, background:'linear-gradient(to bottom, transparent, var(--bg-1))', pointerEvents:'none' }} />
                    )}
                  </div>
                  <button className="liked-expand-btn" onClick={() => setLikedExpanded(!likedExpanded)}>
                    {likedExpanded
                      ? <><span className="liked-expand-arrow up">▲</span> 收起</>
                      : <><span className="liked-expand-arrow">▼</span> 展开全部 {likedSongs.length} 首</>
                    }
                  </button>
                </>
              ) : likedLoaded ? (
                <div className="lib-empty" style={{ padding:'12px 0' }}>还没有红心歌曲</div>
              ) : null}
              <div className="lib-divider" />
            </div>
          )}
          {!neteaseCookie && (
            <div className="lib-login-hint">登录网易云账号后可查看红心歌曲</div>
          )}

          {/* 英语学习收藏 */}
          <div className="lib-section-label">英语学习收藏</div>
          {libSongs.length === 0 ? (
            <div style={{ textAlign:'center',padding:'32px 0' }}>
              <div style={{ fontFamily:'var(--font-display)',fontSize:48,opacity:0.12 }}>♡</div>
              <p style={{ color:'var(--ink-3)',fontSize:14,marginTop:10 }}>还没有收藏歌曲<br />在歌曲或专辑搜索中点击 ♥ 收藏</p>
            </div>
          ) : (
            <div className="lib-grid">
              {libSongs.map((s) => (
                <SongCard key={s.id} song={s} isPlaying={s.id === currentSong?.id} isLoading={loadingId === s.id}
                  inLibrary={true} onPlay={() => playSong(s)} onToggleLib={(e) => toggleLib(e, s)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
