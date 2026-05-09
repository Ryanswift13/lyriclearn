import { create } from 'zustand'
import { setNeteaseLoginCookie } from '../services/netease'

export type Theme = 'calm' | 'playful' | 'dark'
export type AudioQuality = 'standard' | 'higher' | 'exhigh' | 'lossless'

interface SettingsState {
  theme: Theme
  karaoke: boolean
  showTranslation: boolean
  deepseekApiKey: string
  audioQuality: AudioQuality
  neteaseCookie: string
  neteaseNickname: string
  neteaseAvatarUrl: string
  neteaseUid: string
  setTheme: (t: Theme) => void
  setKaraoke: (v: boolean) => void
  setShowTranslation: (v: boolean) => void
  setDeepseekApiKey: (key: string) => void
  setAudioQuality: (q: AudioQuality) => void
  setNeteaseLogin: (cookie: string, nickname: string, avatarUrl: string, uid: string) => void
  clearNeteaseLogin: () => void
}

function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback }
  catch { return fallback }
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: load<Theme>('verse:theme', 'calm'),
  karaoke: load<boolean>('verse:karaoke', true),
  showTranslation: load<boolean>('verse:translation', false),
  deepseekApiKey: localStorage.getItem('deepseek_api_key') ?? '',
  audioQuality: load<AudioQuality>('verse:quality', 'exhigh'),
  neteaseCookie: localStorage.getItem('netease_cookie') ?? '',
  neteaseNickname: localStorage.getItem('netease_nickname') ?? '',
  neteaseAvatarUrl: localStorage.getItem('netease_avatar') ?? '',
  neteaseUid: localStorage.getItem('netease_uid') ?? '',
  setTheme: (theme) => { localStorage.setItem('verse:theme', JSON.stringify(theme)); set({ theme }) },
  setKaraoke: (karaoke) => { localStorage.setItem('verse:karaoke', JSON.stringify(karaoke)); set({ karaoke }) },
  setShowTranslation: (v) => { localStorage.setItem('verse:translation', JSON.stringify(v)); set({ showTranslation: v }) },
  setDeepseekApiKey: (key) => { localStorage.setItem('deepseek_api_key', key); set({ deepseekApiKey: key }) },
  setAudioQuality: (q) => { localStorage.setItem('verse:quality', JSON.stringify(q)); set({ audioQuality: q }) },
  setNeteaseLogin: (cookie, nickname, avatarUrl, uid) => {
    localStorage.setItem('netease_cookie', cookie)
    localStorage.setItem('netease_nickname', nickname)
    localStorage.setItem('netease_avatar', avatarUrl)
    localStorage.setItem('netease_uid', uid)
    set({ neteaseCookie: cookie, neteaseNickname: nickname, neteaseAvatarUrl: avatarUrl, neteaseUid: uid })
  },
  clearNeteaseLogin: () => {
    localStorage.removeItem('netease_cookie')
    localStorage.removeItem('netease_nickname')
    localStorage.removeItem('netease_avatar')
    localStorage.removeItem('netease_uid')
    setNeteaseLoginCookie('')
    set({ neteaseCookie: '', neteaseNickname: '', neteaseAvatarUrl: '', neteaseUid: '' })
  },
}))

// Restore cookie synchronously at module load — before any component effects run
const _initialCookie = localStorage.getItem('netease_cookie') ?? ''
if (_initialCookie) setNeteaseLoginCookie(_initialCookie)
