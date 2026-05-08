import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { WordPopup } from './WordPopup'

interface Props {
  text: string
  isCurrent: boolean
  translation?: string
}

const HAS_LETTER = /[a-zA-Z]/
const CLEAN_WORD = /[^a-z']/g

function tokenize(text: string): string[] {
  return text.split(/(\s+|[,;:.!?'"()\-–—]+)/).filter(Boolean)
}

export function LyricLine({ text, isCurrent, translation }: Props) {
  const [activeWord, setActiveWord] = useState<string | null>(null)

  const handleWordClick = (token: string) => {
    if (!HAS_LETTER.test(token)) return
    const cleanWord = token.toLowerCase().replace(CLEAN_WORD, '')
    setActiveWord(activeWord === cleanWord ? null : cleanWord)
  }

  const tokens = useMemo(() => tokenize(text), [text])

  return (
    <div className="relative">
      <motion.div
        animate={{
          scale: isCurrent ? 1.03 : 1,
          opacity: isCurrent ? 1 : 0.38,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="text-center py-2 px-4"
      >
        <p
          className="leading-relaxed font-medium"
          style={{
            fontSize: isCurrent ? 18 : 15,
            color: isCurrent ? '#fff' : 'rgba(255,255,255,0.38)',
            textShadow: isCurrent ? '0 0 20px rgba(196,181,253,0.5)' : 'none',
            transition: 'font-size 0.3s, color 0.3s',
          }}
        >
          {tokens.map((token, i) => {
            const isWord = HAS_LETTER.test(token)
            const cleanWord = token.toLowerCase().replace(CLEAN_WORD, '')
            const isActive = activeWord === cleanWord && isWord

            return isWord && isCurrent ? (
              <span
                key={i}
                className="relative inline cursor-pointer rounded px-0.5 transition-all"
                style={{
                  background: isActive ? 'rgba(124,58,237,0.3)' : 'transparent',
                  color: isActive ? '#c4b5fd' : 'inherit',
                  borderBottom: !isActive ? '1px dashed rgba(255,255,255,0.2)' : 'none',
                }}
                onClick={() => handleWordClick(token)}
              >
                {token}
                {isActive && (
                  <WordPopup
                    word={cleanWord}
                    sentence={text}
                    onClose={() => setActiveWord(null)}
                  />
                )}
              </span>
            ) : (
              <span key={i}>{token}</span>
            )
          })}
        </p>

        {isCurrent && translation && (
          <p
            className="mt-1 text-sm"
            style={{ color: 'rgba(196,181,253,0.55)', fontStyle: 'italic' }}
          >
            {translation}
          </p>
        )}
      </motion.div>
    </div>
  )
}
