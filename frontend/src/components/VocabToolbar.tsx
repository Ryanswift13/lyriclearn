import type { SortKey } from './VocabScreen'

interface Props {
  query: string
  setQuery: (v: string) => void
  sort: SortKey
  setSort: (v: SortKey) => void
  dueOnly: boolean
  setDueOnly: (v: boolean) => void
  grouped: boolean
  setGrouped: (v: boolean) => void
}

export function VocabToolbar({ query, setQuery, sort, setSort, dueOnly, setDueOnly, grouped, setGrouped }: Props) {
  return (
    <div className="vocab-toolbar">
      <div className="vocab-search">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索单词 / 释义 / 歌曲"
        />
        {query && (
          <button className="vocab-search-clear" onClick={() => setQuery('')} aria-label="清空">✕</button>
        )}
      </div>

      <div className="vocab-toolbar-right">
        <select className="vocab-sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="recent">最近添加</option>
          <option value="alpha">字母 A–Z</option>
          <option value="cefr">CEFR 等级</option>
          <option value="due">待复习优先</option>
        </select>

        <button className={`chip ${dueOnly ? 'on' : ''}`} onClick={() => setDueOnly(!dueOnly)}>
          仅待复习
        </button>

        <div className="vocab-view-toggle">
          <button className={grouped ? 'on' : ''} onClick={() => setGrouped(true)}>按歌曲</button>
          <button className={!grouped ? 'on' : ''} onClick={() => setGrouped(false)}>列表</button>
        </div>
      </div>
    </div>
  )
}
