import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

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
    params: { keywords: keyword, limit: 15, type: 1 },
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

export async function getSongUrl(id: string): Promise<string> {
  const res = await api.get('/song/url/v1', { params: { id, level: 'standard' } })
  return res.data?.data?.[0]?.url ?? ''
}

export async function getLyrics(id: string): Promise<{ lrc: string; tlyric: string }> {
  const res = await api.get('/lyric', { params: { id } })
  return { lrc: res.data?.lrc?.lyric ?? '', tlyric: res.data?.tlyric?.lyric ?? '' }
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
