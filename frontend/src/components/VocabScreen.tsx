import { useMemo, useState } from 'react'
import { useNotebookStore } from '../store/notebookStore'
import { StreakHeatmap } from './StreakHeatmap'
import { VocabToolbar } from './VocabToolbar'
import { VocabList } from './VocabList'
import type { VocabEntry } from '../lib/db'

export type SortKey = 'recent' | 'alpha' | 'cefr' | 'due'

const CEFR_ORDER: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 }

interface Props {
  onStartReview: () => void
  onPlayEntry: (entry: VocabEntry, seekTo?: number) => void
  onPlaySnippet: (entry: VocabEntry) => void
}

export function VocabScreen({ onStartReview, onPlayEntry, onPlaySnippet }: Props) {
  const entries = useNotebookStore((s) => s.entries)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('recent')
  const [dueOnly, setDueOnly] = useState(false)
  const [grouped, setGrouped] = useState(true)

  const dueCount = useMemo(() => {
    const now = Date.now()
    return entries.filter((e) => !e.nextReview || e.nextReview <= now).length
  }, [entries])

  const visible = useMemo(() => {
    const now = Date.now()
    const q = query.trim().toLowerCase()
    let list = entries
    if (q) {
      list = list.filter((e) =>
        e.word.toLowerCase().includes(q) ||
        (e.explanation.cn ?? '').toLowerCase().includes(q) ||
        e.songName.toLowerCase().includes(q),
      )
    }
    if (dueOnly) {
      list = list.filter((e) => !e.nextReview || e.nextReview <= now)
    }
    const sorted = [...list]
    if (sort === 'alpha') {
      sorted.sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()))
    } else if (sort === 'cefr') {
      sorted.sort((a, b) => (CEFR_ORDER[a.explanation.cefr ?? ''] ?? 99) - (CEFR_ORDER[b.explanation.cefr ?? ''] ?? 99))
    } else if (sort === 'due') {
      sorted.sort((a, b) => (a.nextReview ?? 0) - (b.nextReview ?? 0))
    }
    // 'recent' keeps store order (savedAt desc).
    return sorted
  }, [entries, query, sort, dueOnly])

  return (
    <div className="screen">
      <div className="vocab-wrap">
        <div className="screen-head">
          <div>
            <div className="screen-eyebrow">Vocabulary Notebook</div>
            <h1 className="screen-title">生词本</h1>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="vocab-empty card">
            <div className="vocab-empty-icon">📓</div>
            <div className="vocab-empty-title">生词本还是空的</div>
            <div className="vocab-empty-sub">在歌词里点击单词，保存到这里开始积累</div>
          </div>
        ) : (
          <>
            <StreakHeatmap wordCount={entries.length} dueCount={dueCount} onStartReview={onStartReview} />
            <VocabToolbar
              query={query} setQuery={setQuery}
              sort={sort} setSort={setSort}
              dueOnly={dueOnly} setDueOnly={setDueOnly}
              grouped={grouped} setGrouped={setGrouped}
            />
            <VocabList
              entries={visible}
              grouped={grouped}
              onPlayEntry={onPlayEntry}
              onPlaySnippet={onPlaySnippet}
            />
          </>
        )}
      </div>
    </div>
  )
}
