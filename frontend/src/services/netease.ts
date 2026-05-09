import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// ── Login cookie (set after QR auth) ────────────────────────
let _cookie = ''
export function setNeteaseLoginCookie(cookie: string) { _cookie = cookie }
function cp() { return _cookie ? { cookie: _cookie } : {} }

const COLOR_PALETTE: Array<[string, string]> = [
  ['#e8a598', '#b06a52'],
  ['#5b8fa8', '#3d6e85'],
  ['#c4a96d', '#a08850'],
  ['#8ba888', '#6a8868'],
  ['#a08cb0', '#7d6a8f'],
  ['#d4876e', '#3d4a6e'],
  ['#c9a0a0', '#7a4f4f'],
  ['#7ab8c4', '#4a7a9b'],
]

function songColors(id: string): [string, string] {
  const hash = id.split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) & 0xffff, 0)
  return COLOR_PALETTE[hash % COLOR_PALETTE.length]
}

export interface SearchResult {
  id: string
  name: string
  artist: string
  album: string
  duration: number
  coverUrl: string
  color: string
  color2: string
}

export async function searchSongs(keyword: string): Promise<SearchResult[]> {
  const res = await api.get('/cloudsearch', {
    params: { keywords: keyword, limit: 15, type: 1, ...cp() },
  })
  const songs: any[] = res.data?.result?.songs ?? []
  return songs.map((s) => {
    const [color, color2] = songColors(String(s.id))
    return {
      id: String(s.id),
      name: s.name,
      artist: s.ar?.map((a: any) => a.name).join(', ') || '未知',
      album: s.al?.name || '',
      duration: s.dt ? Math.floor(s.dt / 1000) : 0,
      coverUrl: s.al?.picUrl ? `${s.al.picUrl}?param=300y300` : '',
      color,
      color2,
    }
  })
}

export async function getSongUrl(id: string, quality = 'exhigh'): Promise<string> {
  const res = await api.get('/song/url/v1', { params: { id, level: quality, ...cp() } })
  return res.data?.data?.[0]?.url ?? ''
}

export async function getLyrics(id: string): Promise<{ lrc: string; tlyric: string }> {
  const res = await api.get('/lyric', { params: { id, ...cp() } })
  return { lrc: res.data?.lrc?.lyric ?? '', tlyric: res.data?.tlyric?.lyric ?? '' }
}

// ── QR Login ─────────────────────────────────────────────────
export async function getQrKey(): Promise<string> {
  const res = await api.get('/login/qr/key', { params: { timestamp: Date.now() } })
  return res.data.data.unikey
}

export async function getQrImage(key: string): Promise<string> {
  const res = await api.get('/login/qr/create', { params: { key, qrimg: true, timestamp: Date.now() } })
  return res.data.data.qrimg as string
}

export type QrStatus = 800 | 801 | 802 | 803
export async function checkQrStatus(key: string): Promise<{ code: QrStatus; cookie?: string; message: string }> {
  const res = await api.get('/login/qr/check', { params: { key, timestamp: Date.now() } })
  return { code: res.data.code, cookie: res.data.cookie, message: res.data.message ?? '' }
}

export async function getLoginUser(cookie: string): Promise<{ nickname: string; avatarUrl: string; uid: string } | null> {
  try {
    const res = await api.get('/login/status', { params: { timestamp: Date.now(), cookie } })
    const profile = res.data?.data?.profile
    if (!profile) return null
    return { nickname: profile.nickname, avatarUrl: profile.avatarUrl, uid: String(profile.userId ?? '') }
  } catch { return null }
}

// ── User playlists ────────────────────────────────────────────
export interface PlaylistInfo {
  id: string
  name: string
  coverUrl: string
  trackCount: number
  color: string
  color2: string
}

export async function getUserPlaylists(uid: string): Promise<{ liked: PlaylistInfo | null; others: PlaylistInfo[] }> {
  const res = await api.get('/user/playlist', { params: { uid, ...cp() } })
  const raw: any[] = res.data?.playlist ?? []
  const all: PlaylistInfo[] = raw.map((p) => {
    const [color, color2] = songColors(String(p.id))
    return { id: String(p.id), name: p.name, coverUrl: p.coverImgUrl ? `${p.coverImgUrl}?param=300y300` : '', trackCount: p.trackCount ?? 0, color, color2 }
  })
  // The first playlist whose userId === uid is "我喜欢的音乐"
  const likedIdx = raw.findIndex((p) => String(p.userId) === uid)
  const liked = likedIdx >= 0 ? all[likedIdx] : null
  const others = all.filter((_, i) => i !== likedIdx)
  return { liked, others }
}

export async function getPlaylistSongs(playlistId: string, limit = 100): Promise<SearchResult[]> {
  const res = await api.get('/playlist/track/all', { params: { id: playlistId, limit, ...cp() } })
  const songs: any[] = res.data?.songs ?? []
  return songs.map((s) => {
    const [color, color2] = songColors(String(s.id))
    return {
      id: String(s.id), name: s.name,
      artist: s.ar?.map((a: any) => a.name).join(', ') || '未知',
      album: s.al?.name || '',
      duration: s.dt ? Math.floor(s.dt / 1000) : 0,
      coverUrl: s.al?.picUrl ? `${s.al.picUrl}?param=300y300` : '',
      color, color2,
    }
  })
}

export async function logout(cookie: string): Promise<void> {
  await api.get('/logout', { params: { cookie } })
}

// Returns true only for songs that look like English/Western music.
// Rejects anything with Korean Hangul or Japanese Kana in the name or artist.
function isEnglishSong(name: string, artist: string): boolean {
  const text = `${name} ${artist}`
  // Korean Hangul
  if (/[가-힯ᄀ-ᇿ㄰-㆏ꥠ-꥿ힰ-퟿]/.test(text)) return false
  // Japanese Hiragana / Katakana
  if (/[぀-ゟ゠-ヿ･-ﾟ]/.test(text)) return false
  // Song name that is >40% CJK characters (Chinese-only title, not English)
  const cjk = (name.match(/[一-鿿]/g) ?? []).length
  if (cjk > name.length * 0.4) return false
  return true
}

function rawToResult(s: any): SearchResult {
  const [color, color2] = songColors(String(s.id))
  return {
    id: String(s.id), name: s.name,
    artist: s.artists?.map((a: any) => a.name).join(', ') || s.ar?.map((a: any) => a.name).join(', ') || '未知',
    album: s.album?.name || s.al?.name || '',
    duration: s.duration ? Math.floor(s.duration / 1000) : (s.dt ? Math.floor(s.dt / 1000) : 0),
    coverUrl: (() => { const u = s.album?.picUrl || s.al?.picUrl; return u ? `${u}?param=300y300` : '' })(),
    color, color2,
  }
}

// ── Recommendations ───────────────────────────────────────────
export async function getRecommendations(): Promise<SearchResult[]> {
  // Logged-in: use daily recommend (personalised, already English-heavy for this app's users)
  if (_cookie) {
    try {
      const res = await api.get('/recommend/songs', { params: { ...cp() } })
      const songs: any[] = res.data?.data?.dailySongs ?? []
      if (songs.length) {
        const filtered = songs.filter((s) => isEnglishSong(s.name, s.ar?.map((a: any) => a.name).join(' ') ?? ''))
        if (filtered.length >= 6) return filtered.slice(0, 12).map(rawToResult)
      }
    } catch { /* fall through */ }
  }

  // Public fallback: fetch 40 from 欧美热歌榜, filter to English, return 12
  const res = await api.get('/top/song', { params: { type: 16 } })
  const all: any[] = res.data?.data ?? []
  const english = all
    .map((item: any) => item.song ?? item)
    .filter((s) => isEnglishSong(
      s.name,
      s.artists?.map((a: any) => a.name).join(' ') ?? s.ar?.map((a: any) => a.name).join(' ') ?? ''
    ))
  return english.slice(0, 12).map(rawToResult)
}

// ── Album search ──────────────────────────────────────────────
export interface AlbumResult {
  id: string
  name: string
  artist: string
  coverUrl: string
  size: number
  color: string
  color2: string
}

export async function searchAlbums(keyword: string): Promise<AlbumResult[]> {
  const res = await api.get('/cloudsearch', { params: { keywords: keyword, limit: 15, type: 10, ...cp() } })
  const albums: any[] = res.data?.result?.albums ?? []
  return albums.map((a) => {
    const [color, color2] = songColors(String(a.id))
    return {
      id: String(a.id), name: a.name,
      artist: a.artist?.name || a.artists?.[0]?.name || '未知',
      coverUrl: a.blurPicUrl ? `${a.blurPicUrl}?param=300y300` : (a.picUrl ? `${a.picUrl}?param=300y300` : ''),
      size: a.size ?? 0, color, color2,
    }
  })
}

export async function getAlbumSongs(albumId: string): Promise<{ name: string; artist: string; songs: SearchResult[] }> {
  const res = await api.get('/album', { params: { id: albumId, ...cp() } })
  const songs: any[] = res.data?.songs ?? []
  const album = res.data?.album ?? {}
  return {
    name: album.name ?? '',
    artist: album.artist?.name ?? '',
    songs: songs.map((s) => {
      const [color, color2] = songColors(String(s.id))
      return {
        id: String(s.id), name: s.name,
        artist: s.ar?.map((a: any) => a.name).join(', ') || album.artist?.name || '未知',
        album: album.name ?? '',
        duration: s.dt ? Math.floor(s.dt / 1000) : 0,
        coverUrl: album.picUrl ? `${album.picUrl}?param=300y300` : '',
        color, color2,
      }
    }),
  }
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
