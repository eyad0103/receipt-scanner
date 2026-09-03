import { useState, useRef, useEffect, useCallback } from "react"
import { Search, Mic, Trash2, Palette, Heart, Flag, Copy } from "lucide-react"
import { Tooltip } from "@/components/ui/Tooltip"
import { TranscriptSearch } from "@/components/TranscriptSearch"
import { TranscriptSegment } from "@/components/TranscriptLine"
import { useAppContext } from "@/contexts/AppContext"
import { Highlight, Note } from "@/data/types"
import { cn } from "@/lib/utils"

interface TranscriptPanelProps {
  transcript: {
    segments: {
      id: string
      startTime: number
      endTime: number
      text: string
      speaker: string
    }[]
  }
  currentTime: number
  isPlaying: boolean
  onTimestampChange: (time: number) => void
  onSegmentClick: (segment: any) => void
  highlights: Highlight[]
  notes: Note[]
  onHighlight: (color: string) => void
  onNote: (text: string) => void
  onSearch: (query: string) => void
  onClearSearch: () => void
}

export function TranscriptPanel({
  transcript,
  currentTime,
  isPlaying,
  onTimestampChange,
  onSegmentClick,
  highlights,
  notes,
  onHighlight,
  onNote,
  onSearch,
  onClearSearch,
}: TranscriptPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [copyFormat, setCopyFormat] = useState<"plain" | "timestamps" | "markdown">("plain")
  const { toast } = useAppContext()
  const scrollRef = useRef<HTMLDivElement>(null)

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const filteredSegments = transcript.segments.filter((segment) =>
    segment.text.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Sync transcript position with video timestamp
  useEffect(() => {
    if (!isPlaying && isSearching) return

    const container = scrollRef.current
    if (!container) return

    const segments = transcript.segments
    const scrollTop = container.scrollTop
    const containerHeight = container.clientHeight
    const viewportBottom = scrollTop + containerHeight

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const segmentRef = document.getElementById(`segment-${i}`)

      if (segmentRef) {
        const segmentTop = segmentRef.offsetTop
        const segmentBottom = segmentTop + segmentRef.clientHeight

        // Check if segment is in viewport
        const isInViewport = segmentBottom > scrollTop + 50 && segmentTop < viewportBottom - 50

        if (isInViewport) {
          const segmentTime = segment.startTime
          onTimestampChange(segmentTime)

          // Mark as current
          ;(segmentRef as HTMLElement).style.backgroundColor = "rgba(255, 255, 255, 0.1)"
          ;(segmentRef as HTMLElement).style.transition = "background-color 0.1s ease"

          // Remove highlight from previous segment
          const prevRef = document.querySelector(".transcript-active")
          if (prevRef && prevRef !== segmentRef) {
            ;(prevRef as HTMLElement).style.backgroundColor = ""
          }

          segmentRef.classList.add("transcript-active")
          break
        }
      }
    }

    // Cleanup inactive segments
    const allRefs = container.querySelectorAll(".transcript-active")
    allRefs.forEach((ref) => {
      const segmentRef = ref as HTMLElement
      const segmentIndex = parseInt(segmentRef.id?.replace("segment-", "") || "-1")
      if (segmentIndex >= 0 && segmentIndex < segments.length) {
        const segment = segments[segmentIndex]
        if (segment.startTime > currentTime + 10 || segment.startTime < currentTime - 10) {
          segmentRef.style.backgroundColor = ""
          segmentRef.classList.remove("transcript-active")
        }
      }
    })
  }, [currentTime, isPlaying, onTimestampChange, transcript.segments.length])

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    onSearch(query)
  }, [onSearch])

  const handleClearSearch = useCallback(() => {
    setSearchQuery("")
    onClearSearch()
  }, [onClearSearch])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      toast({
        title: "Copied",
        message: `${transcript?.segments?.length || 0} lines copied`,
        type: "success",
      })
      setTimeout(() => setIsCopied(false), 1500)
    } catch (err) {
      toast({
        title: "Couldn't copy",
        message: "Try again or use Ctrl+C",
        type: "error",
      })
    }
  }

  const handleCopyTranscript = () => {
    if (!transcript) return
    let text = ""
    switch (copyFormat) {
      case "plain":
        text = transcript.segments.map((s) => s.text).join("\n")
        break
      case "timestamps":
        text = transcript.segments
          .map((s) => `[${formatTime(s.startTime)}] ${s.text}`)
          .join("\n")
        break
      case "markdown":
        text = transcript.segments
          .map((s) => `**${formatTime(s.startTime)}** ${s.text}`)
          .join("\n\n")
        break
    }
    copyToClipboard(text)
  }

  const CopyButton = (props: {
    isCopied: boolean
    onResetCopy: () => void
    onCopy: () => void
    format: "plain" | "timestamps" | "markdown"
    setFormat: (fmt: "plain" | "timestamps" | "markdown") => void
  }) => {
    return (
      <Tooltip content="Copy transcript">
        <button
          onClick={props.onCopy}
          className={cn(
            "flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            "bg-surface border border-border hover:bg-border hover:text-text transition-colors",
            props.isCopied ? "bg-border/20 text-border" : "bg-transparent hover:bg-border/20 hover:text-border"
          )}
          title={props.isCopied ? "Copied" : "Copy transcript"}
        >
          <Copy className={cn("w-4 h-4", props.isCopied ? "text-green-400" : "text-text-tertiary")} />
          <span className="hidden sm:inline block sm:hidden">
            {props.isCopied ? "✓ Copied" : "Copy"}
          </span>
          <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
        </button>
      </Tooltip>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-2">
        <TranscriptSearch
          transcript={transcript}
          onSearchChange={handleSearchChange}
          onClear={handleClearSearch}
          active={true}
        />
        <CopyButton
          isCopied={isCopied}
          onResetCopy={() => setIsCopied(false)}
          onCopy={handleCopyTranscript}
          format={copyFormat}
          setFormat={setCopyFormat}
        />
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 pb-2"
        style={{ fontSize: "0.875rem" }}
      >
        {filteredSegments.length > 0 ? (
          filteredSegments.map((segment, index) => (
            <TranscriptSegment
              key={segment.id}
              segment={segment}
              index={index}
              isActive={isPlaying && currentTime >= segment.startTime - 2 && currentTime < segment.startTime + 60}
              isCurrent={isPlaying && Math.abs(currentTime - segment.startTime) <= 2}
              onClick={() => onSegmentClick(segment)}
              onDoubleClick={() => {
                // Copy timestamp and text
                const text = `[${formatTime(segment.startTime)}] ${segment.text}`
                navigator.clipboard.writeText(text)
              }}
              onSelect={(selectedText) => {
                // Handle text selection
              }}
              onHighlight={(color) => onHighlight(color)}
              onNote={() => onNote("New note")}
              highlights={highlights}
              notes={notes}
            />
          ))
        ) : (
          <div className="p-6 text-center text-indigo-400">
            <p>No results for “{searchQuery}”</p>
          </div>
        )}
      </div>
    </div>
  )
}