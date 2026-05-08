import { create } from 'zustand'

interface SettingsState {
  deepseekApiKey: string
  setDeepseekApiKey: (key: string) => void
}

const STORAGE_KEY = 'deepseek_api_key'

export const useSettingsStore = create<SettingsState>((set) => ({
  deepseekApiKey: localStorage.getItem(STORAGE_KEY) ?? '',
  setDeepseekApiKey: (key) => {
    localStorage.setItem(STORAGE_KEY, key)
    set({ deepseekApiKey: key })
  },
}))
