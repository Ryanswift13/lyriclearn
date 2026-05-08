import { create } from 'zustand'

export type Theme = 'calm' | 'playful' | 'dark'

interface SettingsState {
  theme: Theme
  karaoke: boolean
  showTranslation: boolean
  deepseekApiKey: string
  setTheme: (t: Theme) => void
  setKaraoke: (v: boolean) => void
  setShowTranslation: (v: boolean) => void
  setDeepseekApiKey: (key: string) => void
}

function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback }
  catch { return fallback }
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: load<Theme>('verse:theme', 'dark'),
  karaoke: load<boolean>('verse:karaoke', true),
  showTranslation: load<boolean>('verse:translation', false),
  deepseekApiKey: localStorage.getItem('deepseek_api_key') ?? '',
  setTheme: (theme) => { localStorage.setItem('verse:theme', JSON.stringify(theme)); set({ theme }) },
  setKaraoke: (karaoke) => { localStorage.setItem('verse:karaoke', JSON.stringify(karaoke)); set({ karaoke }) },
  setShowTranslation: (v) => { localStorage.setItem('verse:translation', JSON.stringify(v)); set({ showTranslation: v }) },
  setDeepseekApiKey: (key) => { localStorage.setItem('deepseek_api_key', key); set({ deepseekApiKey: key }) },
}))
