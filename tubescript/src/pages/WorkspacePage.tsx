import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Sidebar } from "@/components/Sidebar"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { useAppContext } from "@/contexts/AppContext"
import { loadLibrary, addTranscript, updateLastViewed } from "@/lib/storage"
import { LibraryState, SavedTranscript } from "@/data/types"
import { MOCK_VIDEO_ID, MOCK_TRANSCRIPT, MOCK_CHAPTERS, MOCK_HIGHLIGHTS, MOCK_NOTES, MOCK_KEY_MOMENTS, MOCK_SUMMARY } from "@/data/mockData"
import { Workspace } from "@/components/Workspace"
import { TranscriptData } from "@/data/types"

export function WorkspacePage() {
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()
  const { toast } = useAppContext()
  const [state, setState] = useState<LibraryState>(loadLibrary())
  const [transcript, setTranscript] = useState<TranscriptData | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const setCurrentTimeFromWorkspace = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  const onChapterClick = useCallback((chapter: any) => {
    const targetTime = (chapter.startTime + chapter.endTime) / 2
    setCurrentTimeFromWorkspace(targetTime)
  }, [setCurrentTimeFromWorkspace])

  const onKeyMomentClick = useCallback((moment: any) => {
    setCurrentTimeFromWorkspace(moment.timestamp)
  }, [setCurrentTimeFromWorkspace])

  const onNoteClick = useCallback((note: any) => {
    setCurrentTimeFromWorkspace(note.startTime)
  }, [setCurrentTimeFromWorkspace])

  const onHighlightClick = useCallback((highlight: any) => {
    setCurrentTimeFromWorkspace(highlight.startTime)
  }, [setCurrentTimeFromWorkspace])

  // Load transcript on component mount - use mock data
  useEffect(() => {
    setTranscript(MOCK_TRANSCRIPT)
    setState(loadLibrary())
    addTranscript({
      ...MOCK_TRANSCRIPT,
      addedAt: new Date().toISOString(),
      lastViewedAt: new Date().toISOString(),
      isFavorite: false,
      highlights: MOCK_HIGHLIGHTS,
      notes: MOCK_NOTES,
    })
  }, [])

  // No auto-interval - currentTime is driven by user interactions (chapter clicks, timeline, timestamp clicks)

  // Sync current time from video player
  useEffect(() => {
    const handleProgress = (time: number) => {
      setCurrentTime(time)
    }
    // In mock mode, we just set up the interval
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const newTime = prev + 1
        if (newTime >= 1260) {
          clearInterval(interval)
          setIsPlaying(false)
          return 0
        }
        return newTime
      })
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const chapters = MOCK_CHAPTERS
  const highlights = MOCK_HIGHLIGHTS
  const notes = MOCK_NOTES
  const keyMoments = MOCK_KEY_MOMENTS
  const summary = MOCK_SUMMARY

  return (
    <div className="flex min-h-screen bg-background text-text">
      <Sidebar
        onSearch={(query) => console.log("Sidebar search:", query)}
        searchQuery=""
        hasSearchResults={false}
      />
      <main className="flex-1 overflow-hidden">
        <div className="flex h-screen">
<Workspace
          videoId={MOCK_VIDEO_ID}
          transcript={{ segments: transcript?.segments || [], title: MOCK_TRANSCRIPT.title }}
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
          setCurrentTime={setCurrentTimeFromWorkspace}
        />
        </div>
      </main>
    </div>
  )
}