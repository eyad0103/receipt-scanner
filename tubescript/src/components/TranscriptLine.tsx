import { useState } from "react"
import { cn } from "@/lib/utils"
import { Tooltip } from "@/components/ui/Tooltip"
import { Mic, MoreHorizontal, Trash2 } from "lucide-react"

interface TranscriptSegmentProps {
  segment: {
    id: string
    startTime: number
    endTime: number
    text: string
    speaker: string
    confidence?: number
  }
  index: number
  isActive?: boolean | undefined
  isCurrent?: boolean | undefined
  onClick?: () => void
  onDoubleClick?: (e: React.MouseEvent) => void
  onSelect?: (selectedText: string) => void
  onHighlight?: (color: string) => void
  onNote?: (text: string) => void
  highlights?: { id: string; color: string; text: string; createdAt: string }[]
  notes?: { id: string; text: string; createdAt: string }[]
}

function getButtonClassName(isActive: boolean | undefined, isCurrent: boolean | undefined): string {
  return cn(
    "text-xs font-mono whitespace-nowrap mt-0.5 transition-colors duration-200",
    isActive
      ? "text-indigo-400 hover:text-indigo-300"
      : isCurrent
      ? "text-cyan-400 hover:text-cyan-300"
      : "text-indigo-300 hover:text-indigo-200"
  )
}

function getParagraphClassName(isActive: boolean | undefined, isCurrent: boolean | undefined): string {
  return cn(
    "leading-relaxed break-words",
    isActive ? "text-indigo-400 font-medium" : "text-indigo-300",
    isCurrent ? "font-medium" : ""
  )
}

function getOuterDivClassName(isActive: boolean | undefined, isCurrent: boolean | undefined): string {
  return cn(
    "group flex gap-3 items-start py-1.5 px-2 rounded-md transition-all duration-300",
    isActive
      ? "bg-white/[0.04] border-l-2 border-indigo-500"
      : isCurrent
      ? "bg-white/[0.04] border-l-2-cyan-500"
      : "border-l-2 border-transparent"
  )
}

function getInnerDivClassName(isActive: boolean): string {
  return cn(
    "flex-1 cursor-pointer rounded-lg px-0",
    isActive ? "py-1.5" : "py-1.5"
  )
}

export function TranscriptSegment({
  segment,
  index,
  isActive,
  isCurrent,
  onClick,
  onDoubleClick,
  onSelect,
  onHighlight,
  onNote,
  highlights,
  notes,
}: TranscriptSegmentProps) {
  const [isSelected, setIsSelected] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    const selection = window.getSelection()?.toString()
    if (selection && onSelect) {
      onSelect(selection)
    }
  }

  const applyHighlight = (color: string) => {
    onHighlight?.(color)
    setSelectedColor(color)
    setIsSelected(false)
  }

  const addNote = (text: string) => {
    onNote?.(text)
  }

  const hasHighlight = highlights?.some((h) =>
    h.text.toLowerCase().includes(segment.text.toLowerCase().substring(0, 50))
  )

  const hasNote = notes?.some((n) =>
    n.text.toLowerCase().includes(segment.text.toLowerCase().substring(0, 50))
  )

  return (
    <div
      key={segment.id}
      className={getOuterDivClassName(isActive as boolean, isCurrent as boolean)}
      onClick={() => onNote?.(segment.text)}
      onMouseDown={handleMouseDown}
    >
      <button
        className={getButtonClassName(isActive as boolean, isCurrent as boolean)}
        title={`Seek to ${formatTime(segment.startTime)}`}
      >
        [{formatTime(segment.startTime)}]
      </button>
      <div className={getInnerDivClassName(isActive as boolean)}>
        <p className={getParagraphClassName(isActive as boolean, isCurrent as boolean)}>
          {segment.speaker}: {segment.text}
        </p>
      </div>

      {/* Highlight toolbar - appears on click selection */}
      {isSelected && selectedColor && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          <button
            className={cn(
              "p-1 rounded",
              selectedColor === "#fbbf24" ? "bg-yellow-400/30 text-yellow-400" : "",
              selectedColor === "#3b82f6" ? "bg-blue-500/30 text-blue-400" : "",
              selectedColor === "#ec4899" ? "bg-pink-500/30 text-pink-400" : "",
              selectedColor === "#10b981" ? "bg-green-500/30 text-green-400" : "",
              "transition-colors"
            )}
            onClick={() => applyHighlight(selectedColor)}
            title={`Highlight with ${selectedColor}`}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24">
              <rect x="2" y="2" width="20" height="20" rx="4" ry="4" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4h-3z" />
            </svg>
          </button>
          {((highlights ?? []).length ?? 0) > 0 && (
            <button
              className="p-1 rounded hover:bg-border text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              title="Remove highlight"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Note indicator */}
      {hasNote && (
        <Tooltip content="Jump to note">
          <button
            className="p-1 rounded hover:bg-border text-indigo-400 hover:text-indigo-300 transition-colors"
            title="Jump to note"
            onClick={() => onNote?.(segment.text)}
          >
            <Mic className="w-3 h-3" />
          </button>
        </Tooltip>
      )}

      {/* Highlight indicator */}
      {hasHighlight && (
        <Tooltip content="Highlight text">
          <button
            className="p-1 rounded hover:bg-border text-indigo-400 hover:text-indigo-300 transition-colors"
            title="View highlight"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24">
              <rect x="2" y="2" width="20" height="20" rx="4" ry="4" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4h-3z" />
            </svg>
          </button>
        </Tooltip>
      )}
    </div>
  )
}