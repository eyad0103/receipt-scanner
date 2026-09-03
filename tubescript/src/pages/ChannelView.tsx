import { useParams, useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/ui/EmptyState"
import { loadLibrary, toggleChannelFavorite, updateLastViewed } from "@/lib/storage"
import { LibraryState, ChannelData } from "@/data/types"
import { Star, Calendar, Play, Share2, Copy } from "lucide-react"
import { useEffect, useState } from "react"
import { useAppContext } from "@/contexts/AppContext"

export function ChannelView() {
  const { channelId } = useParams<{ channelId: string }>()
  const [state, setState] = useState<LibraryState>(loadLibrary)
  const [channel, setChannel] = useState<ChannelData | null>(null)
  const navigate = useNavigate()
  const { toast } = useAppContext()

  useEffect(() => {
    const library = loadLibrary()
    const ch = library.channels[channelId || ""]
    if (ch) {
      setChannel(ch)
    } else {
      navigate("/channels")
    }
  }, [channelId, navigate])

  if (!channel) {
    return (
      <div className="flex-1 h-screen bg-background overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <EmptyState
            title="Channel not found"
            description="This channel is not in your library."
          />
        </div>
      </div>
    )
  }

  const transcripts = channel.transcriptIds
    .map((id) => state.transcripts[id])
    .filter(Boolean)

  const handleFavorite = () => {
    toggleChannelFavorite(channel.channelId)
    setState(loadLibrary)
    toast({
      message: channel.isFavorite ? "Removed from favorites" : "Added to favorites",
      type: "success",
    })
  }

  const handleOpenYouTube = () => {
    window.open(`https://www.youtube.com/channel/${channel.channelId}`, "_blank")
  }

  const handleCopyChannelURL = async () => {
    const url = `https://www.youtube.com/channel/${channel.channelId}`
    await navigator.clipboard.writeText(url)
    toast({ message: "Channel URL copied to clipboard", type: "success" })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <div className="flex-1 h-screen bg-background overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Channel Header */}
        <Card className="p-6 mb-6">
          <div className="flex gap-4 items-start">
            <img
              src={channel.channelThumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.channelName)}&background=2a2a2a&color=ffffff&size=128`}
              alt={channel.channelName}
              onClick={handleOpenYouTube}
              className="w-24 h-24 rounded-full border border-border object-cover cursor-pointer hover:opacity-90 transition-opacity"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-text mb-1">{channel.channelName}</h1>
                  <p className="text-sm text-text-tertiary mb-3">
                    {channel.transcriptIds.length} saved {channel.transcriptIds.length === 1 ? "video" : "videos"}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-text-tertiary">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      First saved: {formatDate(channel.firstAdded)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Last viewed: {formatDate(channel.lastViewed)}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFavorite}
                    title={channel.isFavorite ? "Unfavorite channel" : "Add to favorites"}
                  >
                    <Star
                      className={`w-4 h-4 transition-all duration-300 ${
                        channel.isFavorite
                          ? "fill-current text-white scale-110"
                          : "text-text-tertiary scale-100"
                      }`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyChannelURL}
                    title="Copy channel URL"
                  >
                    <Copy className="w-4 h-4 text-text-tertiary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenYouTube}
                    title="Open on YouTube"
                  >
                    <Share2 className="w-4 h-4 text-text-tertiary" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Channel Banner placeholder */}
        <Card className="p-6 mb-6">
          <div className="text-center py-8 text-text-tertiary">
            <p className="text-sm">Channel banner not available</p>
          </div>
        </Card>

        {/* Transcripts list */}
        <h2 className="text-lg font-medium text-text mb-4">Saved Videos</h2>
        
        {transcripts.length === 0 ? (
          <EmptyState
            title="No transcripts saved"
            description="Save transcripts from this channel to see them here"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {transcripts.map((transcript) => (
              <Card
                key={transcript.videoId}
                className="p-0 overflow-hidden hover:bg-surface transition-colors"
                onClick={async () => {
                  await updateLastViewed(transcript.videoId)
                  navigate(`/transcript/${transcript.videoId}`)
                }}
              >
                <div className="flex gap-3 p-4">
                  <img
                    src={transcript.thumbnail}
                    alt={transcript.title}
                    className="w-24 h-14 rounded object-cover border border-border flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-text line-clamp-2 mb-1">
                      {transcript.title}
                    </h3>
                    <p className="text-xs text-text-tertiary">
                      Added {formatDate(transcript.addedAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/transcript/${transcript.videoId}`)
                    }}
                    title="Open transcript"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
