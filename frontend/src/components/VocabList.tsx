import { useState } from 'react'
import { useVocabNotebook } from '../hooks/useVocabNotebook'
import type { VocabEntry } from '../lib/db'

interface WordCardProps {
  e: VocabEntry
  onPlayEntry: (entry: VocabEntry, seekTo?: number) => void
  onPlaySnippet: (entry: VocabEntry) => void
  onDelete: (id: number) => void
}

function WordCard({ e, onPlayEntry, onPlaySnippet, onDelete }: WordCardProps) {
  return (
    <div className="flash-item">
      <div className="flash-item-top">
        <div className="flash-item-word-group">
          <span className="flash-word">{e.word}</span>
          {e.explanation.ipa && <span className="flash-ipa">{e.explanation.ipa}</span>}
          {e.explanation.cefr && <span className="flash-cefr">CEFR {e.explanation.cefr}</span>}
          <span className="flash-cn">{e.explanation.cn}</span>
        </div>
        <div className="flash-item-right">
          <span className="flash-review-info">{e.reviewCount ? `${e.reviewCount}×` : '未复习'}</span>
          <button onClick={() => e.id && onDelete(e.id)} className="flash-del" aria-label="删除">✕</button>
        </div>
      </div>

      <div className="flash-source-row">
        <div className="flash-source">"{e.sentence}"</div>
        {e.lineTime !== undefined && (
          <button className="flash-snippet-btn" onClick={() => onPlaySnippet(e)} title="播放这一句">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </button>
        )}
      </div>

      <div className="flash-song-row">
        <span className="flash-song-info">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4, verticalAlign: 'middle', opacity: 0.6 }}>
            <path d="M9 18V5l12-2v13M9 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" />
          </svg>
          {e.songName} · {e.artist}
        </span>
        <div className="flash-play-btns">
          {e.lineTime !== undefined && (
            <button className="flash-play-btn" onClick={() => onPlayEntry(e, e.lineTime)} title="从此处开始播放">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z" /></svg>
              从此处
            </button>
          )}
          <button className="flash-play-btn" onClick={() => onPlayEntry(e, 0)} title="从头播放">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z" /></svg>
            从头播放
          </button>
        </div>
      </div>
    </div>
  )
}

interface Props {
  entries: VocabEntry[]
  grouped: boolean
  onPlayEntry: (entry: VocabEntry, seekTo?: number) => void
  onPlaySnippet: (entry: VocabEntry) => void
}

export function VocabList({ entries, grouped, onPlayEntry, onPlaySnippet }: Props) {
  const { deleteWord } = useVocabNotebook()
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  if (entries.length === 0) {
    return <div className="flash-empty">没有匹配的单词</div>
  }

  if (!grouped) {
    return (
      <div className="vocab-flat">
        {entries.map((e) => (
          <WordCard key={e.id} e={e} onPlayEntry={onPlayEntry} onPlaySnippet={onPlaySnippet} onDelete={deleteWord} />
        ))}
      </div>
    )
  }

  // Group by source song, preserving the already-sorted order of `entries`.
  const groups: { songId: string; songName: string; artist: string; items: VocabEntry[] }[] = []
  const indexBySong = new Map<string, number>()
  for (const e of entries) {
    let i = indexBySong.get(e.songId)
    if (i === undefined) {
      i = groups.length
      indexBySong.set(e.songId, i)
      groups.push({ songId: e.songId, songName: e.songName, artist: e.artist, items: [] })
    }
    groups[i].items.push(e)
  }

  const toggle = (songId: string) => setCollapsed((prev) => {
    const next = new Set(prev)
    if (next.has(songId)) next.delete(songId)
    else next.add(songId)
    return next
  })

  return (
    <div className="vocab-groups">
      {groups.map((g) => {
        const isCollapsed = collapsed.has(g.songId)
        return (
          <div className="vocab-group" key={g.songId}>
            <button className="vocab-group-head" onClick={() => toggle(g.songId)}>
              <span className={`vocab-group-caret ${isCollapsed ? 'collapsed' : ''}`}>▾</span>
              <span className="vocab-group-name">{g.songName}</span>
              <span className="vocab-group-artist">{g.artist}</span>
              <span className="vocab-group-count">{g.items.length} 词</span>
            </button>
            {!isCollapsed && (
              <div className="vocab-flat">
                {g.items.map((e) => (
                  <WordCard key={e.id} e={e} onPlayEntry={onPlayEntry} onPlaySnippet={onPlaySnippet} onDelete={deleteWord} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
