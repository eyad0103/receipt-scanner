import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/Card"
import { EmptyState } from "@/components/ui/EmptyState"
import { Tooltip } from "@/components/ui/Tooltip"
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from "@/components/ui/ContextMenu"
import { loadLibrary, updateLastViewed, toggleFavorite, removeTranscript } from "@/lib/storage"
import { LibraryState, SavedTranscript } from "@/data/types"
import { Clock, Calendar, Star, Trash2, Copy, ExternalLink, Play } from "lucide-react"
import { useAppContext } from "@/contexts/AppContext"

export function Recent() {
  const [state, setState] = useState<LibraryState>(loadLibrary())
  const navigate = useNavigate()
  const { toast } = useAppContext()

  const recentTranscripts = useMemo(() => {
    return state.recent
      .map((id) => state.transcripts[id])
      .filter(Boolean)
      .sort(
        (a, b) =>
          new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime(),
      )
  }, [state.recent, state.transcripts])

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
    return date.toLocaleDateString()
  }

  const getReadingProgress = (transcript: SavedTranscript) => {
    if (!transcript.readingProgress) return null
    return transcript.readingProgress.percentage
  }

  const handleOpen = async (transcript: SavedTranscript) => {
    await updateLastViewed(transcript.videoId)
    navigate(`/transcript/${transcript.videoId}`)
  }

  const handleRemove = (videoId: string) => {
    removeTranscript(videoId)
    setState(loadLibrary())
    toast({ message: "Removed from recent", type: "info" })
  }

  const handleFavorite = (videoId: string) => {
    toggleFavorite(videoId)
    setState(loadLibrary())
    toast({
      message: "Favorite toggled",
      type: "info",
    })
  }

  const handleCopyURL = (videoId: string) => {
    navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${videoId}`)
    toast({ message: "Copied to clipboard", type: "success" })
  }

  return (
    <div className="flex-1 h-screen bg-background overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text mb-2">Recent</h1>
          <p className="text-sm text-text-tertiary">
            {recentTranscripts.length} recently viewed transcript{recentTranscripts.length !== 1 ? "s" : ""}
          </p>
        </div>

        {recentTranscripts.length === 0 ? (
          <EmptyState
            title="No recent transcripts"
            description="Recently viewed transcripts will appear here"
            icon={<Clock className="w-8 h-8 text-text-tertiary" />}
          />
        ) : (
          <div className="space-y-2">
            {recentTranscripts.map((transcript) => {
              const progress = getReadingProgress(transcript)
              return (
                <ContextMenu
                  key={transcript.videoId}
                  trigger={
                    <Card
                      className="p-3 cursor-pointer hover:bg-surface transition-colors group"
                      onClick={() => handleOpen(transcript)}
                    >
                      <div className="flex gap-3 items-center">
                        <div className="relative flex-shrink-0">
                          <img
                            src={transcript.thumbnail}
                            alt={transcript.title}
                            className="w-16 h-9 rounded object-cover border border-border group-hover:opacity-90 transition-opacity"
                          />
                          {transcript.channelThumbnail && (
                            <img
                              src={transcript.channelThumbnail}
                              alt={transcript.channel}
                              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background object-cover"
                            />
                          )}
                          {progress !== null && (
                            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-white text-black rounded-full border border-border flex items-center justify-center text-xs font-medium">
                              {Math.round(progress)}%
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-text line-clamp-1">
                            {transcript.title}
                          </h3>
                          <p className="text-xs text-text-tertiary">{transcript.channel}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(transcript.lastViewedAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(transcript.addedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {progress !== null && (
                          <div className="w-12 h-1.5 bg-border rounded-full overflow-hidden flex-shrink-0">
                            <div
                              className="h-full bg-white rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </Card>
                  }
                >
                  <ContextMenuItem
                    icon={<Play className="w-4 h-4" />}
                    onClick={() => handleOpen(transcript)}
                  >
                    Resume ({progress !== null ? `${Math.round(progress)}%` : "Open"})
                  </ContextMenuItem>
                  <ContextMenuItem
                    icon={<Star className="w-4 h-4" />}
                    onClick={() => handleFavorite(transcript.videoId)}
                  >
                    {transcript.isFavorite ? "Remove from" : "Add to"} Favorites
                  </ContextMenuItem>
                  <ContextMenuItem
                    icon={<Copy className="w-4 h-4" />}
                    onClick={() => handleCopyURL(transcript.videoId)}
                  >
                    Copy Video URL
                  </ContextMenuItem>
                  <ContextMenuItem
                    icon={<ExternalLink className="w-4 h-4" />}
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${transcript.videoId}`, "_blank")}
                  >
                    Open on YouTube
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    icon={<Trash2 className="w-4 h-4" />}
                    destructive
                    onClick={() => handleRemove(transcript.videoId)}
                  >
                    Remove from Recent
                  </ContextMenuItem>
                </ContextMenu>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
