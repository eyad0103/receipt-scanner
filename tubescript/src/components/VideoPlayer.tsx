import { useState, useRef, useEffect, useCallback } from "react"

interface VideoPlayerProps {
  videoId: string
  onProgress?: (currentTime: number) => void
  onPlaying?: () => void
  onPaused?: () => void
}

declare global {
  interface Window {
    YT: {
      Player: new (element: HTMLElement | string, options: any) => any
      PlayerState: {
        PLAYING: number
        PAUSED: number
        ENDED: number
      }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

export function VideoPlayer({ videoId, onProgress, onPlaying, onPaused }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const createdRef = useRef(false)
  const [error, setError] = useState(false)

  const startProgress = useCallback(() => {
    if (progressRef.current) return
    progressRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
        try {
          const t = playerRef.current.getCurrentTime()
          if (typeof t === "number" && isFinite(t)) onProgress?.(t)
        } catch (_e) {
          // ignore
        }
      }
    }, 250)
  }, [onProgress])

  const stopProgress = useCallback(() => {
    if (progressRef.current) {
      clearInterval(progressRef.current)
      progressRef.current = null
    }
  }, [])

  useEffect(() => {
    if (createdRef.current) return
    if (!containerRef.current) return
    if (typeof window.YT === "undefined" || !window.YT.Player) return

    createdRef.current = true

    try {
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: "100%",
        width: "100%",
        videoId,
        playerVars: {
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
        },
        events: {
          onReady: () => {
            startProgress()
          },
          onStateChange: (event: any) => {
            if (event.data === 1) {
              onPlaying?.()
              startProgress()
            } else {
              onPaused?.()
            }
          },
        },
      })
    } catch (e) {
      console.error("YouTube player error:", e)
      setError(true)
    }

    return () => {
      stopProgress()
    }
  }, [videoId, onProgress, onPlaying, onPaused, startProgress, stopProgress])

  if (error) return null

  return (
    <div ref={containerRef} className="w-full aspect-video" />
  )
}
