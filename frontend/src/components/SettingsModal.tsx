import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore } from '../store/settingsStore'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: Props) {
  const { deepseekApiKey, setDeepseekApiKey } = useSettingsStore()
  const [draft, setDraft] = useState(deepseekApiKey)

  const handleSave = () => {
    setDeepseekApiKey(draft)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="rounded-2xl p-6 w-full"
              style={{
                maxWidth: 440,
                background: 'rgba(15,12,30,0.99)',
                border: '1px solid rgba(124,58,237,0.25)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                pointerEvents: 'auto',
              }}
            >
              <h2 className="font-semibold mb-4" style={{ color: '#c4b5fd', fontSize: 18 }}>
                ⚙️ 设置
              </h2>

              <div className="mb-4">
                <label className="block text-sm mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  DeepSeek API Key
                </label>
                <input
                  type="password"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.9)',
                    caretColor: '#7c3aed',
                  }}
                />
                <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  前往 platform.deepseek.com 获取 API Key，保存在本地浏览器中
                </p>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    background: '#7c3aed',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
