import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotebookStore } from '../store/notebookStore'
import { useVocabNotebook } from '../hooks/useVocabNotebook'
import type { VocabEntry } from '../lib/db'

export function NotebookPanel() {
  const { isOpen, setIsOpen, entries } = useNotebookStore()
  const { deleteWord } = useVocabNotebook()

  return (
    <>
      {/* 背景遮罩 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          />
        )}
      </AnimatePresence>

      {/* 侧边抽屉 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
            style={{
              width: 360,
              background: 'rgba(12,10,25,0.98)',
              borderLeft: '1px solid rgba(124,58,237,0.2)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* 标题栏 */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div>
                <h2 className="font-semibold" style={{ color: '#c4b5fd', fontSize: 16 }}>
                  生词本
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {entries.length} 个单词
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full flex items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  background: 'rgba(255,255,255,0.07)',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            </div>

            {/* 单词列表 */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {entries.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-40">
                  <span style={{ fontSize: 40 }}>📚</span>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    还没有保存单词
                  </p>
                </div>
              )}
              {entries.map((entry) => (
                <VocabCard key={entry.id} entry={entry} onDelete={deleteWord} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function VocabCard({
  entry,
  onDelete,
}: {
  entry: VocabEntry
  onDelete: (id: number) => void
}) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className="rounded-xl p-4 cursor-pointer transition-all"
      style={{
        background: flipped ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${flipped ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.07)'}`,
      }}
      onClick={() => setFlipped(!flipped)}
    >
      {!flipped ? (
        /* 正面：单词 + 原句 */
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold" style={{ color: '#c4b5fd', fontSize: 18 }}>
              {entry.word}
            </h3>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(entry.id!) }}
              className="text-xs px-2 py-0.5 rounded transition-all"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: 'rgba(239,68,68,0.6)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              删除
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
            "{entry.sentence}"
          </p>
          <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
            🎵 {entry.songName} · {entry.artist}
          </p>
          <p className="text-xs mt-2" style={{ color: 'rgba(124,58,237,0.6)' }}>
            点击查看解释 →
          </p>
        </div>
      ) : (
        /* 背面：AI 解释 */
        <div className="flex flex-col gap-2">
          <h3 className="font-bold mb-1" style={{ color: '#c4b5fd', fontSize: 16 }}>
            {entry.word}
          </h3>
          <Row icon="📖" label="词义" content={entry.explanation.definition} />
          <Row icon="🎵" label="歌词解读" content={entry.explanation.example} />
          {entry.explanation.culture && (
            <Row icon="🌍" label="文化背景" content={entry.explanation.culture} />
          )}
          <Row icon="💡" label="记忆技巧" content={entry.explanation.memory_tip} />
          <p className="text-xs mt-1" style={{ color: 'rgba(124,58,237,0.5)' }}>
            点击折叠
          </p>
        </div>
      )}
    </div>
  )
}

function Row({ icon, label, content }: { icon: string; label: string; content: string }) {
  return (
    <div>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {icon} {label}
      </p>
      <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
        {content}
      </p>
    </div>
  )
}
