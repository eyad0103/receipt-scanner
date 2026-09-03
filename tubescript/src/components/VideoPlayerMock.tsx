import { useState, useRef, useEffect, useCallback } from "react"

interface VideoPlayerMockProps {
  videoId: string
  onProgress?: (currentTime: number) => void
  onPlaying?: () => void
  onPaused?: () => void
  onSeek?: (time: number) => void
}

export function VideoPlayerMock({ videoId, onProgress, onPlaying, onPaused, onSeek }: VideoPlayerMockProps) {
  const seekToTime = (time: number) => {
    setCurrentTime(time)
  }

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  const handlePlay = useCallback(() => {
    setIsPlaying(true)
    if (onPlaying) onPlaying()
  }, [onPlaying])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
    if (onPaused) onPaused()
  }, [onPaused])

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time)
    if (onSeek) onSeek(time)
  }, [onSeek])

  useEffect(() => {
    const startTime = 0
    const direction = 1
    let elapsed = 0

    if (isPlaying) {
      animationRef.current = window.requestAnimationFrame(function animate() {
        elapsed += 16 * direction
        const newTime = Math.min(Math.max(elapsed % 1260, 0), 1260)
        setCurrentTime(newTime)
        onProgress?.(newTime)
        animationRef.current = window.requestAnimationFrame(animate)
      })
    }

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, onProgress])

  const chapters = [
    { name: "Intro", start: 0, end: 120, color: "from-indigo-500 to-purple-500" },
    { name: "Extraction", start: 120, end: 300, color: "from-teal-500 to-emerald-500" },
    { name: "Sync", start: 300, end: 540, color: "from-violet-500 to-pink-500" },
    { name: "Search", start: 540, end: 720, color: "from-orange-500 to-amber-500" },
    { name: "Notes", start: 720, end: 900, color: "from-green-500 to-lime-500" },
    { name: "Conclusion", start: 900, end: 1260, color: "from-red-500 to-rose-500" },
  ]

  const activeChapter = chapters.find(
    (c) => currentTime >= c.start && currentTime < c.end
  )

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-gradient-to-b from-indigo-900 via-purple-900 to-violet-900">
      {/* Timeline markers */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/5">
        {chapters.map((chapter) => (
          <div
            key={chapter.name}
            className={`flex flex-1 ${activeChapter?.name === chapter.name ? "border-t-2 border-white" : "border-transparent"}`}
          />
        ))}
      </div>

      {/* Chapter names along timeline */}
      {chapters.map((chapter) => {
        const percent = (chapter.start / 1260) * 100
        return (
          <div
            key={chapter.name}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-white/50 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${percent}%` }}
          >
            {chapter.name}
          </div>
        )
      })}

      {/* Playhead */}
      <div
        className={`absolute -bottom-1 left-[${(currentTime / 1260) * 100}%] transform -translate-x-1/2 w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-200`}
        aria-label={`Timestamp ${formatTime(currentTime)} / 21:00`}
      >
        <div className="w-full h-full rounded-full bg-indigo-600" />
      </div>

      {/* Video canvas */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        onClick={handlePlay}
        title={isPlaying ? "Pause" : "Play"}
      >
        <svg
          className={`w-14 h-14 text-white ${isPlaying ? "rotate-180" : ""} transition-transform duration-200`}
          viewBox="0 0 24 24"
        >
          <polygon
            points="8 5 19 12 8 19"
            className={`fill-current ${isPlaying ? "text-indigo-400" : "text-white"}`
          } />
        </svg>
      </div>

      {/* Pause overlay when playing */}
      {isPlaying && (
        <div
          className="absolute inset-0 bg-black/20 select-none"
          aria-label="Video playing"
        />
      )}

      {/* Controls */}
      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePause}
            className="w-10 h-10 rounded-full bg-surface border border-border hover:bg-border hover:text-text transition-colors"
            aria-label="Pause"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" ry="2" />
              <rect x="12" y="6" width="12" height="12" rx="2" ry="2" />
            </svg>
          </button>
          <span className="text-sm text-white/70">
            {formatTime(currentTime)} / {formatTime(1260)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => seekToTime(0)}
            className="w-8 h-8 rounded-full bg-surface border border-border hover:bg-border hover:text-text transition-colors"
            aria-label="Skip back"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M15.41 7.41L14 8l-5.41 5.41L10 6l-6 6 2 5 10-10L14 8l1.41 1.41z" />
            </svg>
          </button>
          <button
            onClick={() => seekToTime(1260)}
            className="w-8 h-8 rounded-full bg-surface border border-border hover:bg-border hover:text-text transition-colors"
            aria-label="Skip forward"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M8.59 16.34l5.5-5.5L15 12l-5.41-5.41L14 6l6 6-2 5-10-10z" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-white/70">
          <span>00:00</span>
          <span>{formatTime(1260)}</span>
        </div>

        <div className="flex items-center gap-3">
          {/** Theater mode **/}
          <button
            className="w-9 h-9 rounded-md bg-surface border border-border hover:bg-border hover:text-text transition-colors"
            aria-label="Theater mode"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
              <line x1="3" y1="21" x2="21" y2="21" stroke="current" strokeWidth="2" />
            </svg>
          </button>

          {/** Picture in picture **/}
          <button
            className="w-9 h-9 rounded-md bg-surface border border-border hover:bg-border hover:text-text transition-colors"
            aria-label="Picture in picture"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <rect x="2" y="2" width="20" height="20" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" />
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>

          {/** Fullscreen **/}
          <button
            className="w-9 h-9 rounded-md bg-surface border border-border hover:bg-border hover:text-text transition-colors"
            aria-label="Fullscreen"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <rect x="1" y="1" width="22" height="22" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
              <line x1="1" y1="5" x2="1" y2="21" stroke="currentColor" strokeWidth="2" />
              <line x1="5" y1="1" x2="21" y2="1" stroke="currentColor" strokeWidth="2" />
              <line x1="21" y1="21" x2="21" y2="21" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}