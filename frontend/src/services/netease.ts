import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export interface SearchResult {
  id: string
  name: string
  artist: string
  album: string
  duration: number
  coverUrl: string
}

export async function searchSongs(keyword: string): Promise<SearchResult[]> {
  const res = await api.get('/cloudsearch', {
    params: { keywords: keyword, limit: 15, type: 1 },
  })
  const songs: any[] = res.data?.result?.songs ?? []
  return songs.map((s) => ({
    id: String(s.id),
    name: s.name,
    artist: s.ar?.map((a: any) => a.name).join(', ') || '未知',
    album: s.al?.name || '',
    duration: s.dt ? Math.floor(s.dt / 1000) : 0,
    coverUrl: s.al?.picUrl ? `${s.al.picUrl}?param=300y300` : '',
  }))
}

export async function getSongUrl(id: string): Promise<string> {
  const res = await api.get('/song/url/v1', {
    params: { id, level: 'standard' },
  })
  return res.data?.data?.[0]?.url ?? ''
}

export async function getLyrics(id: string): Promise<{ lrc: string; tlyric: string }> {
  const res = await api.get('/lyric', { params: { id } })
  return {
    lrc: res.data?.lrc?.lyric ?? '',
    tlyric: res.data?.tlyric?.lyric ?? '',
  }
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
