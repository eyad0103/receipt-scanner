import { useState } from "react"
import { Search, Sparkles, Square, Grid, Text, Zap, Menu, Clock, Folder, Box, Star, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/Card"
import { Tooltip } from "@/components/ui/Tooltip"
import { Button } from "@/components/ui/Button"
import { useAppContext } from "@/contexts/AppContext"

interface IntelligencePanelProps {
  currentTime: number
  isPlaying: boolean
  highlights: { id: string; color: string; text: string }[]
  notes: { id: string; text: string }[]
  chapters: { id: string; name: string; startTime: number; endTime: number; color: string }[]
  keyMoments: { id: string; timestamp: number; title: string; description: string; color: string }[]
  onChapterClick: (chapter: any) => void
  onKeyMomentClick: (moment: any) => void
  onNoteClick: (note: any) => void
  onHighlightClick: (highlight: any) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function IntelligencePanel({
  currentTime,
  isPlaying,
  highlights,
  notes,
  chapters,
  keyMoments,
  onChapterClick,
  onKeyMomentClick,
  onNoteClick,
  onHighlightClick,
}: IntelligencePanelProps) {
  const [view, setView] = useState<"summary" | "chapters" | "key-moments" | "notes">("summary")

  const formatTimeCode = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const getSummaryForTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    if (minutes < 2) {
      return "Introduction to the video content and setup demonstration."
    }
    if (minutes < 5) {
      return "The speaker explains the core concept of the interactive transcript system, emphasizing modularity and component independence."
    }
    if (minutes < 8) {
      return "Discussion of transcript synchronization and how components communicate through shared state management."
    }
    if (minutes < 11) {
      return "Search functionality and highlight system are explained, with support for multiple colors and persistent storage."
    }
    return "The video concludes with final thoughts about the future of interactive video transcripts and research workspaces."
  }

  const chaptersData = chapters.map((chapter) => ({
    ...chapter,
    isActive: currentTime >= chapter.startTime && currentTime < chapter.endTime,
  }))

  const keyMomentsData = keyMoments.map((moment) => ({
    ...moment,
    isNear: Math.abs(moment.timestamp - currentTime) <= 30,
  }))

  return (
    <div className="w-full bg-[--background] border-l border-indigo-500/20">
      <div className="p-4 border-b border-indigo-500/20">
        <h3 className="text-sm font-medium text-indigo-400 uppercase tracking-wider">
          Intelligence
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 w-6 h-6"
            onClick={() => setView("summary")}
            title="Show summary"
          >
            <Info className="w-3 h-3" />
          </Button>
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary View */}
        {view === "summary" && (
          <Card className="p-4">
            <h4 className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-3">Summary</h4>
            <p className="text-indigo-300 leading-relaxed">
              {getSummaryForTime(currentTime)}
            </p>
          </Card>
        )}

        {/* Chapters View */}
        {view === "chapters" && (
          <Card className="p-4">
            <h4 className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-3">Chapters</h4>
            <div className="space-y-2">
              {chaptersData.map((chapter) => (
                <Button
                  key={chapter.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors",
                    "hover:bg-indigo-500/10 hover:text-indigo-400",
                    chapter.isActive ? "bg-indigo-500 text-indigo-100" : ""
                  )}
                  onClick={() => onChapterClick(chapter)}
                  title={chapter.name}
                >
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  {chapter.name}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Key Moments View */}
        {view === "key-moments" && (
          <Card className="p-4">
            <h4 className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-3">Key Moments</h4>
            <div className="space-y-2">
              {keyMomentsData.map((moment) => (
                <Button
                  key={moment.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors",
                    "hover:bg-pink-500/10 hover:text-pink-400",
                    moment.isNear ? "bg-pink-500 text-pink-100" : ""
                  )}
                  onClick={() => onKeyMomentClick(moment)}
                  title={`${moment.title} (${formatTimeCode(moment.timestamp)})`}
                >
                  <Zap className="w-2 h-2 text-pink-400" />
                  {moment.title}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Notes View */}
        {view === "notes" && (
          <Card className="p-4">
            <h4 className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-3">Your Notes</h4>
            <div className="space-y-2">
              {notes.map((note) => (
                <Button
                  key={note.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors",
                    "hover:bg-indigo-500/10 hover:text-indigo-400",
                    note.text.length > 50 ? "truncate" : ""
                  )}
                  onClick={() => onNoteClick(note)}
                  title={note.text}
                >
                  {note.text.length > 30 ? `${note.text.substring(0, 30)}...` : note.text}
                </Button>
              ))}
              {notes.length === 0 && (
                <p className="text-xs text-indigo-500">No notes yet. Press H to highlight, N to add a note.</p>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}