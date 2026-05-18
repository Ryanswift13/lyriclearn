import { usePlayerStore } from '../store/playerStore'

// Full-screen ambient layer behind all content. Soft, heavily-blurred colour
// blobs driven by the current song's palette; colours cross-fade on song change.
export function Ambient() {
  const ambient = usePlayerStore((s) => s.ambient)

  return (
    <div className="ambient" aria-hidden="true">
      <div className="ambient-blob ambient-blob-1" style={{ backgroundColor: ambient.c1 }} />
      <div className="ambient-blob ambient-blob-2" style={{ backgroundColor: ambient.c2 }} />
      <div className="ambient-blob ambient-blob-3" style={{ backgroundColor: ambient.c1 }} />
      <div className="ambient-grain" />
    </div>
  )
}
