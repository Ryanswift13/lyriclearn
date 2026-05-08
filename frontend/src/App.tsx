import { useState } from 'react'
import { VinylDisk } from './components/VinylDisk'
import { PlayerControls } from './components/PlayerControls'
import { LyricsPanel } from './components/LyricsPanel'
import { SearchBar } from './components/SearchBar'
import { NotebookPanel } from './components/NotebookPanel'
import { SettingsModal } from './components/SettingsModal'
import { useAudioPlayer } from './hooks/useAudioPlayer'
import { useLyricsSync } from './hooks/useLyricsSync'
import { useVocabInit } from './hooks/useVocabNotebook'
import { usePlayerStore } from './store/playerStore'
import { useNotebookStore } from './store/notebookStore'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { song, isPlaying } = usePlayerStore()
  const { isOpen: notebookOpen, setIsOpen: setNotebookOpen, entries } = useNotebookStore()

  const { seek } = useAudioPlayer()
  useLyricsSync()
  useVocabInit()

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: '#0a0a0f' }}
    >
      {/* 顶部 Header */}
      <header
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(10,10,15,0.8)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span style={{ fontSize: 20 }}>🎵</span>
          <span
            className="font-semibold text-sm hidden sm:block"
            style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}
          >
            LyricLearn
          </span>
        </div>

        {/* 搜索框 */}
        <div className="flex-1 flex justify-center px-4" style={{ maxWidth: 560 }}>
          <SearchBar />
        </div>

        {/* 右侧按钮组 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 生词本按钮 */}
          <button
            onClick={() => setNotebookOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all"
            style={{
              background: notebookOpen ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
            }}
          >
            <span>📚</span>
            {entries.length > 0 && (
              <span
                className="rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: '#7c3aed',
                  color: 'white',
                  width: 18,
                  height: 18,
                  fontSize: 10,
                }}
              >
                {entries.length}
              </span>
            )}
          </button>

          {/* 设置按钮 */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center justify-center rounded-full transition-all"
            style={{
              width: 34,
              height: 34,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 16,
            }}
          >
            ⚙
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 flex overflow-hidden">
        {/* 左侧：黑胶唱片 + 歌曲信息 */}
        <div
          className="flex-shrink-0 flex flex-col items-center justify-center gap-6 px-8"
          style={{
            width: 340,
            borderRight: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          <VinylDisk
            coverUrl={song?.coverUrl ?? ''}
            isPlaying={isPlaying}
          />

          {song ? (
            <div className="text-center px-4">
              <h2
                className="font-semibold text-base truncate"
                style={{ color: 'rgba(255,255,255,0.9)' }}
              >
                {song.name}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {song.artist}
              </p>
              {song.album && (
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {song.album}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center px-4">
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>
                搜索一首英文歌开始学习
              </p>
            </div>
          )}
        </div>

        {/* 右侧：歌词区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <LyricsPanel />
        </div>
      </main>

      {/* 底部播放控制 */}
      <div className="flex-shrink-0">
        <PlayerControls onSeek={seek} />
      </div>

      {/* 生词本侧边栏 */}
      <NotebookPanel />

      {/* 设置弹窗 */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
