import { useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { VideoPlayerMock } from "@/components/VideoPlayerMock"
import { TranscriptPanel } from "@/components/TranscriptPanel"
import { IntelligencePanel } from "@/components/IntelligencePanel"
import { useAppContext } from "@/contexts/AppContext"
import { Tooltip } from "@/components/ui/Tooltip"
import { Button } from "@/components/ui/Button"
import { Highlight, Note } from "@/data/types"

interface WorkspaceProps {
  videoId: string
  transcript: {
    segments: {
      id: string
      startTime: number
      endTime: number
      text: string
      speaker: string
    }[]
    title: string
  }
  currentTime: number
  isPlaying: boolean
  highlights: Highlight[]
  notes: Note[]
  chapters: { id: string; name: string; startTime: number; endTime: number; color: string }[]
  keyMoments: { id: string; timestamp: number; title: string; description: string; color: string }[]
  onChapterClick: (chapter: any) => void
  onKeyMomentClick: (moment: any) => void
  onNoteClick: (note: any) => void
  onHighlightClick: (highlight: any) => void
  setCurrentTime: (time: number) => void
}

export function Workspace({ videoId, transcript, currentTime, isPlaying, highlights, notes, chapters, keyMoments, setCurrentTime }: WorkspaceProps) {
  const [panelWidths, setPanelWidths] = useState<{ video: number; transcript: number; intelligence: number }>({
    video: 30,
    transcript: 40,
    intelligence: 30,
  })
  const [isDragging, setIsDragging] = useState<"video" | "transcript" | null>()
  const startX = useRef<number>(0)
  const startWidth = useRef<number>(0)

  const [currentHighlight, setCurrentHighlight] = useState<Highlight | null>(null)

const onChapterClick = useCallback((chapter: any) => {
    const targetTime = (chapter.startTime + chapter.endTime) / 2
    setCurrentTime(targetTime)
  }, [setCurrentTime])

  const onKeyMomentClick = useCallback((moment: any) => {
    setCurrentTime(moment.timestamp)
  }, [setCurrentTime])

  const onNoteClick = useCallback((note: any) => {
    setCurrentTime(note.startTime)
  }, [setCurrentTime])

  const onHighlightClick = useCallback((highlight: Highlight) => {
    setCurrentTime(highlight.startTime)
    setCurrentHighlight(highlight)
  }, [setCurrentTime])

  const handleDragStart = (direction: "video" | "transcript", e: React.MouseEvent) => {
    setIsDragging(direction)
    startX.current = e.clientX
    startWidth.current = panelWidths[direction]
    e.preventDefault()
  }

  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    const delta = e.clientX - startX.current
    const newWidth = Math.max(20, Math.min(60, startWidth.current + delta))
    const otherPercent = 100 - newWidth - panelWidths.intelligence

    if (isDragging === "video") {
      setPanelWidths({
        video: newWidth,
        transcript: Math.max(20, otherPercent),
        intelligence: panelWidths.intelligence,
      })
    } else {
      setPanelWidths({
        video: panelWidths.video,
        transcript: Math.max(20, otherPercent),
        intelligence: panelWidths.intelligence,
      })
    }
  }, [panelWidths.video, panelWidths.transcript, panelWidths.intelligence, isDragging])

  const handleDragEnd = useCallback(() => {
    setIsDragging(null)
    // Save the panel widths to localStorage
    localStorage.setItem("tubescript_panel_widths", JSON.stringify(panelWidths))
  }, [panelWidths])

  const videoPercent = panelWidths.video
  const transcriptPercent = panelWidths.transcript
  const intelligencePercent = panelWidths.intelligence

  return (
    <div className="w-full h-full grid grid-cols-[${videoPercent}%,_1fr,_${intelligencePercent}%] gap-4">
      {/* Video Column */}
      <div className="bg-[--surface] rounded-xl border border-border overflow-hidden h-full">
        <VideoPlayerMock
          videoId={videoId}
          onProgress={(time) => console.log(`Player timestamp: ${time}s`)}
          onPlaying={() => console.log("Video playing")}
          onPaused={() => console.log("Video paused")}
        />

        <div className="p-4 pt-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-indigo-400 uppercase tracking-wider">Video Player</h3>
            <Tooltip content="The video player with timeline and chapter markers">
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                title="Fullscreen"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24">
                  <rect x="1" y="1" width="22" height="22" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                  <line x1="1" y1="5" x2="1" y2="21" stroke="currentColor" strokeWidth="2" />
                  <line x1="5" y1="1" x2="21" y2="1" stroke="currentColor" strokeWidth="2" />
                </svg>
              </Button>
            </Tooltip>
          </div>

          <p className="text-xs text-indigo-500">
            {transcript.segments.length} segments • {transcript.title}
          </p>

          <div className="h-64 bg-gradient-to-b from-indigo-900 via-purple-900 to-violet-900 rounded-lg overflow-hidden mb-4">
            {/* Timeline with chapter markers */}
            <div className="relative h-full">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-white/5">
                {chapters.map((chapter) => (
                  <div
                    key={chapter.name}
                    className={`flex flex-1 ${currentTime >= chapter.startTime && currentTime < chapter.endTime ? "border-t-2 border-indigo-500" : "border-transparent"} transition-all duration-300`}
                  />
                ))}
              </div>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                {chapters.map((chapter) => {
                  const percent = (chapter.startTime / 1260) * 100
                  return (
                    <div
                      key={chapter.name}
                      style={{ left: `${percent}%` }}
                      className="cursor-pointer"
                      onClick={() => onChapterClick(chapter)}
                    >
                      {chapter.name}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-indigo-500">
            <span>00:00</span>
            <span>21:00</span>
          </div>
        </div>
      </div>

      {/* Transcript Column */}
      <div className="bg-[--surface] rounded-xl border border-border overflow-hidden h-full flex flex-col">
        <TranscriptPanel
          transcript={{ segments: transcript.segments }}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onTimestampChange={(time) => console.log(`Transcript sync: ${time}s`)}
          onSegmentClick={(segment) => console.log(`Segment clicked: ${formatTime(segment.startTime)}`)}
          highlights={highlights}
          notes={notes}
          onHighlight={(color) => console.log(`Highlight with ${color}`)}
          onNote={(text) => console.log(`Add note: ${text}`)}
          onSearch={(query) => console.log(`Search: ${query}`)}
          onClearSearch={() => console.log("Clear search")}
        />

        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-indigo-400 uppercase tracking-wider">
              Transcript
            </h3>
            <span className="text-xs text-indigo-500">
              {transcript.segments.length} segments
            </span>
          </div>
        </div>
      </div>

      {/* Intelligence Column */}
      <div className="bg-[--surface] rounded-xl border border-border overflow-hidden h-full">
        <IntelligencePanel
          currentTime={currentTime}
          isPlaying={isPlaying}
          highlights={highlights}
          notes={notes}
          chapters={chapters}
          keyMoments={keyMoments}
          onChapterClick={onChapterClick}
          onKeyMomentClick={onKeyMomentClick}
          onNoteClick={onNoteClick}
          onHighlightClick={onHighlightClick}
        />
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}