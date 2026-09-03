import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { EmptyState } from "@/components/ui/EmptyState"
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from "@/components/ui/ContextMenu"
import { loadLibrary, toggleChannelFavorite, updateLastViewed } from "@/lib/storage"
import { LibraryState, ChannelData } from "@/data/types"
import { Search, Tv, Calendar, BarChart3, Star, Play, ExternalLink, Copy, Trash2 } from "lucide-react"

export function Channels() {
  const [state, setState] = useState<LibraryState>(loadLibrary())
  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate()

  const channels = Object.values(state.channels)

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels

    const query = searchQuery.toLowerCase()
    return channels.filter(
      (c) =>
        c.channelName.toLowerCase().includes(query) ||
        c.transcriptIds.some((id) => {
          const t = state.transcripts[id]
          return t?.title.toLowerCase().includes(query)
        }),
    )
  }, [channels, searchQuery, state.transcripts])

  const handleFavorite = (channelId: string) => {
    toggleChannelFavorite(channelId)
    setState(loadLibrary())
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString()
  }

  const handleCopyChannelURL = (channel: ChannelData) => {
    navigator.clipboard.writeText(`https://www.youtube.com/channel/${channel.channelId}`)
  }

  const handleOpenChannel = (channel: ChannelData) => {
    window.open(`https://www.youtube.com/channel/${channel.channelId}`, "_blank")
  }

  const handleDeleteChannel = (channel: ChannelData) => {
    if (window.confirm(`Remove all ${channel.transcriptIds.length} transcripts from ${channel.channelName}?`)) {
      // Implementation would go here
    }
  }

  return (
    <div className="flex-1 h-screen bg-background overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text mb-2">Channels</h1>
            <p className="text-sm text-text-tertiary">
              {channels.length} channel{channels.length !== 1 ? "s" : ""} with saved transcripts
            </p>
          </div>

          <div className="relative">
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
              icon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>

        {filteredChannels.length === 0 ? (
          <EmptyState
            title="No channels yet"
            description="Channels are created automatically when you save transcripts"
            icon={<Tv className="w-8 h-8 text-text-tertiary" />}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChannels.map((channel) => (
              <ContextMenu
                key={channel.channelId}
                trigger={
                  <Card
                    className="p-0 overflow-hidden hover:bg-surface transition-all duration-200 group cursor-pointer"
                    onClick={() => navigate(`/channels/${channel.channelId}`)}
                    onDoubleClick={() => {
                      if (channel.transcriptIds.length > 0) {
                        const firstId = channel.transcriptIds[0]
                        updateLastViewed(firstId)
                        navigate(`/transcript/${firstId}`)
                      }
                    }}
                  >
                    <div className="flex gap-4 p-4 items-center">
                      <div className="relative flex-shrink-0">
                        <img
                          src={channel.channelThumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.channelName)}&background=2a2a2a&color=ffffff`}
                          alt={channel.channelName}
                          className="w-12 h-12 rounded-full object-cover border border-border group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-surface border border-border rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <BarChart3 className="w-3 h-3 text-text-tertiary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-text group-hover:text-white transition-colors">
                          {channel.channelName}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-xs text-text-tertiary group-hover:text-text-secondary transition-colors">
                          <span className="flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" />
                            {channel.transcriptIds.length} videos
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(channel.lastViewed)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFavorite(channel.channelId)
                        }}
                        className={`p-1 rounded transition-all duration-300 ${
                          channel.isFavorite
                            ? "text-white bg-white/10 scale-110"
                            : "text-text-tertiary hover:text-text"
                        }`}
                        title={channel.isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Card>
                }
              >
                <ContextMenuItem
                  icon={<Play className="w-4 h-4" />}
                  onClick={() => {
                    if (channel.transcriptIds.length > 0) {
                      const firstId = channel.transcriptIds[0]
                      updateLastViewed(firstId)
                      navigate(`/transcript/${firstId}`)
                    }
                  }}
                >
                  Open First Video
                </ContextMenuItem>
                <ContextMenuItem
                  icon={<Star className="w-4 h-4" />}
                  onClick={() => handleFavorite(channel.channelId)}
                >
                  {channel.isFavorite ? "Remove from" : "Add to"} Favorites
                </ContextMenuItem>
                <ContextMenuItem
                  icon={<Copy className="w-4 h-4" />}
                  onClick={() => handleCopyChannelURL(channel)}
                >
                  Copy Channel URL
                </ContextMenuItem>
                <ContextMenuItem
                  icon={<ExternalLink className="w-4 h-4" />}
                  onClick={() => handleOpenChannel(channel)}
                >
                  Open on YouTube
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  icon={<Trash2 className="w-4 h-4" />}
                  destructive
                  onClick={() => handleDeleteChannel(channel)}
                >
                  Remove Channel
                </ContextMenuItem>
              </ContextMenu>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
