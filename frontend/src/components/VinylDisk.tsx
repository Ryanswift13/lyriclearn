interface Props {
  coverUrl: string
  isPlaying: boolean
  color: string
  color2: string
  size?: number
}

export function VinylDisk({ coverUrl, isPlaying, color, color2, size = 320 }: Props) {
  return (
    <div
      className={`album-art ${isPlaying ? 'spinning' : ''}`}
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <div className="album-disc">
        {coverUrl
          ? <img className="album-cover-img" src={coverUrl} alt="" />
          : <div className="album-gradient" style={{ background: `radial-gradient(circle at 30% 30%, ${color} 0%, ${color2} 70%, #1a1a1a 100%)` }} />
        }
        <div className="album-grooves" aria-hidden="true" />
        <div className="album-label" style={{ background: color2 }}>
          <div className="album-label-inner" />
        </div>
      </div>
    </div>
  )
}
