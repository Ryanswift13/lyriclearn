interface Props {
  coverUrl: string
  isPlaying: boolean
}

export function VinylDisk({ coverUrl, isPlaying }: Props) {
  return (
    <div className="relative flex items-center justify-center select-none">
      {/* 黑胶唱片主体 */}
      <div
        className={`relative rounded-full ${isPlaying ? 'vinyl-spinning' : 'vinyl-paused'}`}
        style={{
          width: 280,
          height: 280,
          background: 'radial-gradient(circle at center, #1c1c1c 0%, #0d0d0d 100%)',
          boxShadow: isPlaying
            ? '0 0 40px rgba(124, 58, 237, 0.3), 0 20px 60px rgba(0,0,0,0.8)'
            : '0 20px 60px rgba(0,0,0,0.8)',
        }}
      >
        {/* 黑胶纹路 SVG */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.25 }}
        >
          {[10, 16, 22, 28, 34, 40, 46].map((r) => (
            <circle
              key={r}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="#888"
              strokeWidth="0.4"
            />
          ))}
        </svg>

        {/* 专辑封面（中心圆） */}
        <div
          className="absolute rounded-full overflow-hidden"
          style={{
            width: '42%',
            height: '42%',
            top: '29%',
            left: '29%',
            border: '2px solid #333',
          }}
        >
          {coverUrl ? (
            <img src={coverUrl} alt="封面" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: '#1a1a2e' }}
            >
              <span style={{ fontSize: 28 }}>🎵</span>
            </div>
          )}
        </div>

        {/* 中心轴孔 */}
        <div
          className="absolute rounded-full"
          style={{
            width: '7%',
            height: '7%',
            top: '46.5%',
            left: '46.5%',
            background: '#111',
            border: '1px solid #333',
          }}
        />
      </div>

      {/* 播放时的外发光环 */}
      {isPlaying && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 296,
            height: 296,
            border: '1px solid rgba(124, 58, 237, 0.3)',
            boxShadow: '0 0 20px rgba(124, 58, 237, 0.15)',
          }}
        />
      )}
    </div>
  )
}
