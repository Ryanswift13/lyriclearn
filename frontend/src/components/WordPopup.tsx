import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { explainWord, type WordExplanation } from '../services/deepseek'
import { useSettingsStore } from '../store/settingsStore'
import { useVocabNotebook } from '../hooks/useVocabNotebook'
import { usePlayerStore } from '../store/playerStore'

interface Props {
  word: string
  sentence: string
  onClose: () => void
}

export function WordPopup({ word, sentence, onClose }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [explanation, setExplanation] = useState<WordExplanation | null>(null)
  const [saved, setSaved] = useState(false)

  const { deepseekApiKey } = useSettingsStore()
  const { saveWord } = useVocabNotebook()
  const { song } = usePlayerStore()

  useEffect(() => {
    if (!deepseekApiKey) {
      setError('请先在设置中填写 DeepSeek API Key')
      setLoading(false)
      return
    }
    explainWord(word, sentence, song?.name ?? '', song?.artist ?? '', deepseekApiKey)
      .then((exp) => {
        setExplanation(exp)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message || '请求失败')
        setLoading(false)
      })
  }, [word, sentence])

  const handleSave = async () => {
    if (!explanation || !song) return
    await saveWord({
      word,
      sentence,
      songName: song.name,
      artist: song.artist,
      songId: song.id,
      explanation,
    })
    setSaved(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="absolute z-50 rounded-xl p-4"
        style={{
          background: 'rgba(15,12,30,0.97)',
          border: '1px solid rgba(124,58,237,0.3)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.8), 0 0 20px rgba(124,58,237,0.1)',
          width: 300,
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: 8,
        }}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full flex items-center justify-center transition-all"
          style={{
            width: 24,
            height: 24,
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          ✕
        </button>

        {/* 单词标题 */}
        <div className="mb-3 pr-6">
          <h3 className="text-lg font-bold" style={{ color: '#c4b5fd' }}>
            {word}
          </h3>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
            "{sentence}"
          </p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-4">
            <div
              className="rounded-full border-2"
              style={{
                width: 16,
                height: 16,
                borderColor: 'rgba(124,58,237,0.3)',
                borderTopColor: '#7c3aed',
                animation: 'spin 0.7s linear infinite',
                flexShrink: 0,
              }}
            />
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              AI 分析中…
            </span>
          </div>
        )}

        {error && (
          <p className="text-sm py-2" style={{ color: '#f87171' }}>
            {error}
          </p>
        )}

        {explanation && (
          <div className="flex flex-col gap-3">
            <Row icon="📖" label="词义" content={explanation.definition} />
            <Row icon="🎵" label="歌词解读" content={explanation.example} />
            {explanation.culture && (
              <Row icon="🌍" label="文化背景" content={explanation.culture} />
            )}
            <Row icon="💡" label="记忆技巧" content={explanation.memory_tip} />

            <button
              onClick={handleSave}
              disabled={saved || !song}
              className="mt-1 w-full py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: saved ? 'rgba(255,255,255,0.08)' : 'rgba(124,58,237,0.5)',
                border: saved ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(124,58,237,0.5)',
                color: saved ? 'rgba(255,255,255,0.4)' : 'white',
                cursor: saved ? 'default' : 'pointer',
              }}
            >
              {saved ? '✓ 已加入生词本' : '＋ 加入生词本'}
            </button>
          </div>
        )}
      </motion.div>
  )
}

function Row({ icon, label, content }: { icon: string; label: string; content: string }) {
  return (
    <div>
      <p className="text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {icon} {label}
      </p>
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
        {content}
      </p>
    </div>
  )
}
