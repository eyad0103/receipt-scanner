import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { EmptyState } from "@/components/ui/EmptyState"
import { Tooltip } from "@/components/ui/Tooltip"
import { useTranscriptExtraction } from "@/hooks/useTranscriptExtraction"
import { loadLibrary, updateLastViewed } from "@/lib/storage"
import { LibraryState, SavedTranscript } from "@/data/types"
import { ERROR_CODES } from "@/data/errors"
import { Search, Play, Loader2, AlertCircle, Star, History, Plus } from "lucide-react"

export function Dashboard() {
  const [url, setUrl] = useState("")
  const [state, setState] = useState<LibraryState>(loadLibrary())
  const navigate = useNavigate()
  const { extract, error, isLoading } = useTranscriptExtraction()

  const handleSubmit = async () => {
    if (!url.trim() || isLoading) return

    const result = await extract(url)
    if (result) {
      navigate(`/transcript/${result.videoId}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubmit()
    }
  }

  const isError = error?.code === ERROR_CODES.INVALID_URL

  const recentTranscripts = useMemo(() => {
    return state.recent
      .slice(0, 5)
      .map((id) => state.transcripts[id])
      .filter(Boolean)
  }, [state.recent, state.transcripts])

  const favoriteTranscripts = useMemo(() => {
    return state.favorites.transcripts
      .slice(0, 4)
      .map((id) => state.transcripts[id])
      .filter(Boolean)
  }, [state.favorites.transcripts, state.transcripts])

  const favoriteChannels = useMemo(() => {
    return state.favorites.channels
      .slice(0, 4)
      .map((id) => state.channels[id])
      .filter(Boolean)
  }, [state.favorites.channels, state.channels])

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getReadingProgress = (transcript: SavedTranscript) => {
    if (!transcript.readingProgress) return null
    return transcript.readingProgress.percentage
  }

  return (
    <div className="flex-1 h-screen bg-background overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-text mb-2">TubeScript</h1>
          <p className="text-sm text-text-tertiary">
            Read, search, and manage YouTube transcripts
          </p>
        </div>

        <div className="space-y-4 mb-12">
          <div className="relative">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste any YouTube video URL or ID..."
              icon={<Search className="w-5 h-5" />}
              disabled={isLoading}
              error={isError ? error?.userMessage : undefined}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!url.trim() || isLoading}
            className="w-full"
            size="lg"
            title="Fetch transcript (Enter)"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fetching transcript...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Get Transcript
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-text-tertiary mb-8">
          Supports youtube.com/watch, youtu.be, youtube.com/live, and youtube.com/shorts
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Tooltip content="The total number of transcripts saved in your local library.">
            <Card
              className="p-4 text-center cursor-pointer hover:bg-surface transition-colors"
              onClick={() => navigate("/library")}
            >
              <div className="text-2xl font-bold text-text mb-1">
                {state.stats.totalTranscripts}
              </div>
              <p className="text-xs text-text-tertiary">Transcripts saved</p>
            </Card>
          </Tooltip>
          <Tooltip content="The total number of unique YouTube channels with saved transcripts.">
            <Card
              className="p-4 text-center cursor-pointer hover:bg-surface transition-colors"
              onClick={() => navigate("/channels")}
            >
              <div className="text-2xl font-bold text-text mb-1">
                {state.stats.totalChannels}
              </div>
              <p className="text-xs text-text-tertiary">Channels</p>
            </Card>
          </Tooltip>
          <Tooltip content="The total number of transcripts and channels you've marked as favorites.">
            <Card
              className="p-4 text-center cursor-pointer hover:bg-surface transition-colors"
              onClick={() => navigate("/favorites")}
            >
              <div className="text-2xl font-bold text-text mb-1">
                {state.stats.totalFavorites}
              </div>
              <p className="text-xs text-text-tertiary">Favorites</p>
            </Card>
          </Tooltip>
          <Tooltip content="The total number of transcripts exported to files.">
            <Card
              className="p-4 text-center cursor-pointer hover:bg-surface transition-colors"
              onClick={() => navigate("/downloads")}
            >
              <div className="text-2xl font-bold text-text mb-1">
                {state.stats.totalDownloads}
              </div>
              <p className="text-xs text-text-tertiary">Downloads</p>
            </Card>
          </Tooltip>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-medium text-text mb-4 flex items-center gap-2">
              <History className="w-4 h-4" />
              Recently viewed
            </h2>

            {recentTranscripts.length === 0 ? (
              <EmptyState
                title="No recent transcripts"
                description="Transcripts you view will appear here"
              />
            ) : (
              <div className="space-y-2">
                {recentTranscripts.map((transcript) => {
                  const progress = getReadingProgress(transcript)
                  return (
                    <Card
                      key={transcript.videoId}
                      className="p-3 cursor-pointer hover:bg-surface transition-colors group"
                      onClick={async () => {
                        await updateLastViewed(transcript.videoId)
                        navigate(`/transcript/${transcript.videoId}`)
                      }}
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
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-text line-clamp-1">
                            {transcript.title}
                          </h3>
                          <p className="text-xs text-text-tertiary">{transcript.channel}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-text-tertiary">
                            <span>{formatTimeAgo(transcript.lastViewedAt)}</span>
                            {progress !== null && (
                              <>
                                <span>•</span>
                                <span>{Math.round(progress)}% read</span>
                              </>
                            )}
                          </div>
                        </div>
                        {progress !== null && (
                          <div className="w-8 h-1.5 bg-border rounded-full overflow-hidden flex-shrink-0">
                            <div
                              className="h-full bg-white rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-medium text-text mb-4 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Favorites
            </h2>

            {favoriteTranscripts.length === 0 ? (
              <EmptyState
                title="No favorites"
                description="Favorite transcripts to access them quickly"
              />
            ) : (
              <div className="space-y-2">
                {favoriteTranscripts.map((transcript) => (
                  <Card
                    key={transcript.videoId}
                    className="p-3 cursor-pointer hover:bg-surface transition-colors"
                    onClick={async () => {
                      await updateLastViewed(transcript.videoId)
                      navigate(`/transcript/${transcript.videoId}`)
                    }}
                  >
                    <div className="flex gap-3 items-center">
                      <img
                        src={transcript.thumbnail}
                        alt={transcript.title}
                        className="w-16 h-9 rounded object-cover border border-border flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-text line-clamp-1">
                          {transcript.title}
                        </h3>
                        <p className="text-xs text-text-tertiary">{transcript.channel}</p>
                      </div>
                      <Star className="w-3.5 h-3.5 fill-current text-text flex-shrink-0" />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {favoriteChannels.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-medium text-text-tertiary mb-2">
                  Favorite Channels
                </h3>
                <div className="space-y-2">
                  {favoriteChannels.map((channel) => (
                    <Card
                      key={channel.channelId}
                      className="p-3 cursor-pointer hover:bg-surface transition-colors"
                      onClick={() => navigate(`/channels/${channel.channelId}`)}
                    >
                      <div className="flex gap-3 items-center">
                        <img
                          src={channel.channelThumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.channelName)}&background=2a2a2a&color=ffffff`}
                          alt={channel.channelName}
                          className="w-8 h-8 rounded-full border border-border flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text">{channel.channelName}</p>
                          <p className="text-xs text-text-tertiary">
                            {channel.transcriptIds.length} transcripts
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
