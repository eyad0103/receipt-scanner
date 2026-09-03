import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/Card"
import { EmptyState } from "@/components/ui/EmptyState"
import { Tooltip } from "@/components/ui/Tooltip"
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from "@/components/ui/ContextMenu"
import { loadLibrary, toggleFavorite, toggleChannelFavorite, removeTranscript, updateLastViewed } from "@/lib/storage"
import { LibraryState } from "@/data/types"
import { Heart, Trash2, Star, Play, Calendar, ExternalLink, Copy, Pin } from "lucide-react"
import { useAppContext } from "@/contexts/AppContext"

export function Favorites() {
  const [state, setState] = useState<LibraryState>(loadLibrary())
  const navigate = useNavigate()
  const { toast } = useAppContext()

  const favoriteTranscripts = useMemo(() => {
    return state.favorites.transcripts
      .map((id) => state.transcripts[id])
      .filter(Boolean)
  }, [state])

  const favoriteChannels = useMemo(() => {
    return state.favorites.channels
      .map((id) => state.channels[id])
      .filter(Boolean)
  }, [state])

  const handleRemoveTranscript = (videoId: string) => {
    toggleFavorite(videoId)
    setState(loadLibrary())
    toast({
      message: "Removed from favorites",
      type: "info",
    })
  }

  const handleRemoveChannel = (channelId: string) => {
    toggleChannelFavorite(channelId)
    setState(loadLibrary())
    toast({
      message: "Removed from favorites",
      type: "info",
    })
  }

  const handleDeleteTranscript = (videoId: string) => {
    removeTranscript(videoId)
    setState(loadLibrary())
    toast({
      message: "Transcript deleted",
      type: "info",
    })
  }

  const formatTimeAgo = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString()
  }

  const handleCopyURL = (videoId: string) => {
    navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${videoId}`)
    toast({ message: "Copied to clipboard", type: "success" })
  }

  return (
    <div className="flex-1 h-screen bg-background overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text mb-2">Favorites</h1>
          <p className="text-sm text-text-tertiary">
            {favoriteTranscripts.length + favoriteChannels.length} favorite item
            {favoriteTranscripts.length + favoriteChannels.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-medium text-text mb-4">Favorite Videos</h2>
          {favoriteTranscripts.length === 0 ? (
            <EmptyState
              title="No favorite videos"
              description="Star transcripts to add them here"
              icon={<Heart className="w-6 h-6 text-text-tertiary" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteTranscripts.map((transcript) => (
                <ContextMenu
                  key={transcript.videoId}
                  trigger={
                    <Card
                      className="p-4 cursor-pointer hover:bg-surface transition-colors group"
                      onClick={async () => {
                        await updateLastViewed(transcript.videoId)
                        navigate(`/transcript/${transcript.videoId}`)
                      }}
                    >
                      <div className="flex gap-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={transcript.thumbnail}
                            alt={transcript.title}
                            className="w-20 h-11 rounded object-cover border border-border group-hover:opacity-90 transition-opacity"
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
                          <h3 className="text-sm font-medium text-text line-clamp-2 mb-1">
                            {transcript.title}
                          </h3>
                          <p className="text-xs text-text-tertiary">{transcript.channel}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-text-tertiary">
                            <Calendar className="w-3 h-3" />
                            <span>{formatTimeAgo(transcript.addedAt)}</span>
                          </div>
                        </div>
                        <Tooltip content={transcript.isFavorite ? "Unfavorite" : "Favorite"}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveTranscript(transcript.videoId)
                            }}
                            className={`p-1 rounded transition-all duration-300 ${
                              transcript.isFavorite
                                ? "text-white bg-white/10 scale-110"
                                : "text-text-tertiary hover:text-white"
                            }`}
                            title={transcript.isFavorite ? "Unfavorite" : "Add to favorites"}
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </button>
                        </Tooltip>
                      </div>
                    </Card>
                  }
                >
                  <ContextMenuItem
                    icon={<Play className="w-4 h-4" />}
                    onClick={() => navigate(`/transcript/${transcript.videoId}`)}
                  >
                    Open Transcript
                  </ContextMenuItem>
                  <ContextMenuItem
                    icon={<Star className="w-4 h-4" />}
                    onClick={() => handleRemoveTranscript(transcript.videoId)}
                  >
                    Remove from Favorites
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
                    onClick={() => handleDeleteTranscript(transcript.videoId)}
                  >
                    Delete Transcript
                  </ContextMenuItem>
                </ContextMenu>
              ))}
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-medium text-text mb-4">Favorite Channels</h2>
          {favoriteChannels.length === 0 ? (
            <EmptyState
              title="No favorite channels"
              description="Star channels to add them here"
              icon={<Heart className="w-6 h-6 text-text-tertiary" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteChannels.map((channel) => (
                <ContextMenu
                  key={channel.channelId}
                  trigger={
                    <Card
                      className="p-4 cursor-pointer hover:bg-surface transition-colors group"
                      onClick={() => navigate(`/channels/${channel.channelId}`)}
                    >
                      <div className="flex gap-3 items-center">
                        <div className="relative flex-shrink-0">
                          <img
                            src={channel.channelThumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.channelName)}&background=2a2a2a&color=ffffff`}
                            alt={channel.channelName}
                            className="w-10 h-10 rounded-full border border-border group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-white text-black rounded-full flex items-center justify-center">
                            <Pin className="w-2 h-2 fill-current" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-text group-hover:text-white transition-colors">
                            {channel.channelName}
                          </h3>
                          <p className="text-xs text-text-tertiary">
                            {channel.transcriptIds.length} saved transcripts
                          </p>
                        </div>
                        <Tooltip content={channel.isFavorite ? "Unfavorite channel" : "Favorite channel"}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveChannel(channel.channelId)
                            }}
                            className={`p-1 rounded transition-all duration-300 ${
                              channel.isFavorite
                                ? "text-white scale-110"
                                : "text-text-tertiary hover:text-text"
                            }`}
                            title={channel.isFavorite ? "Unfavorite" : "Add to favorites"}
                          >
                            <Star className={`w-3.5 h-3.5 ${channel.isFavorite ? "fill-current text-white" : ""}`} />
                          </button>
                        </Tooltip>
                      </div>
                    </Card>
                  }
                >
                  <ContextMenuItem
                    icon={<Play className="w-4 h-4" />}
                    onClick={() => {
                      if (channel.transcriptIds.length > 0) {
                        navigate(`/transcript/${channel.transcriptIds[0]}`)
                      }
                    }}
                  >
                    Open First Video
                  </ContextMenuItem>
                  <ContextMenuItem
                    icon={<Star className="w-4 h-4" />}
                    onClick={() => handleRemoveChannel(channel.channelId)}
                  >
                    Remove from Favorites
                  </ContextMenuItem>
                  <ContextMenuItem
                    icon={<ExternalLink className="w-4 h-4" />}
                    onClick={() => window.open(`https://www.youtube.com/channel/${channel.channelId}`, "_blank")}
                  >
                    Open on YouTube
                  </ContextMenuItem>
                </ContextMenu>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
