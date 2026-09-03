import { useState, useMemo, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Video, Clock, Heart, BarChart3, X } from "lucide-react"
import { loadLibrary } from "@/lib/storage"
import { LibraryState } from "@/data/types"
import { useAppContext } from "@/contexts/AppContext"

interface GlobalSearchProps {
  onClose: () => void
}

export function GlobalSearch({ onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("")
  const [state] = useState(() => loadLibrary())
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { addToSearchHistory } = useAppContext()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = useMemo(() => {
    if (!query.trim()) return null

    const q = query.toLowerCase()
    const transcripts = Object.values(state.transcripts)

    const matchingTranscripts = transcripts.filter((t) =>
      t.title.toLowerCase().includes(q) ||
      t.channel.toLowerCase().includes(q) ||
      t.segments.some((s) => s.text.toLowerCase().includes(q)),
    )

    const matchedTranscripts = matchingTranscripts
      .filter((t) => t.title.toLowerCase().includes(q) || t.channel.toLowerCase().includes(q))
      .slice(0, 5)

    const matchedByContent = matchingTranscripts
      .filter((t) => !matchedTranscripts.includes(t))
      .slice(0, 3)

    const recentMatches = transcripts
      .filter((t) => t.lastViewedAt && new Date(t.lastViewedAt).getTime() > 0)
      .sort((a, b) => new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime())
      .slice(0, 3)

    const favorites = transcripts
      .filter((t) => t.isFavorite)
      .slice(0, 3)

    const channels = Object.values(state.channels)
      .filter((c) => c.channelName.toLowerCase().includes(q))
      .slice(0, 3)

    return {
      transcripts: matchedTranscripts,
      contentMatches: matchedByContent,
      recent: recentMatches,
      favorites,
      channels,
    }
  }, [query, state])

  const handleResultClick = (videoId: string) => {
    addToSearchHistory(query)
    navigate(`/transcript/${videoId}`)
    onClose()
  }

  const handleChannelClick = (channelId: string) => {
    addToSearchHistory(query)
    navigate(`/channels/${channelId}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden animate-in fade-in duration-150">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Search className="w-4 h-4 text-text-tertiary" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search transcripts, channels, content..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose()
            }}
            className="flex-1 bg-transparent border-none outline-none text-sm text-text placeholder:text-text-tertiary"
            autoComplete="off"
          />
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-border text-text-tertiary hover:text-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {!results && (
            <div className="p-6 text-center text-text-tertiary">
              <p className="text-sm">Type to search across all transcripts</p>
              <p className="text-xs mt-1">Search by title, channel, or content</p>
            </div>
          )}

          {results && query.trim() && (
            <>
              {results.transcripts.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs text-text-tertiary font-medium uppercase">
                    Videos
                  </div>
                  {results.transcripts.map((transcript) => (
                    <div
                      key={transcript.videoId}
                      onClick={() => handleResultClick(transcript.videoId)}
                      className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-surface transition-colors"
                    >
                      <img
                        src={transcript.thumbnail}
                        alt={transcript.title}
                        className="w-12 h-7 rounded object-cover border border-border flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text line-clamp-1">{transcript.title}</p>
                        <p className="text-xs text-text-tertiary">{transcript.channel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.contentMatches.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs text-text-tertiary font-medium uppercase">
                    In transcripts
                  </div>
                  {results.contentMatches.map((transcript) => (
                    <div
                      key={transcript.videoId}
                      onClick={() => handleResultClick(transcript.videoId)}
                      className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-surface transition-colors"
                    >
                      <BarChart3 className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text line-clamp-1">{transcript.title}</p>
                        <p className="text-xs text-text-tertiary">{transcript.channel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.channels.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs text-text-tertiary font-medium uppercase">
                    Channels
                  </div>
                  {results.channels.map((channel) => (
                    <div
                      key={channel.channelId}
                      onClick={() => handleChannelClick(channel.channelId)}
                      className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-surface transition-colors"
                    >
                      <img
                        src={channel.channelThumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.channelName)}&background=2a2a2a&color=ffffff`}
                        alt={channel.channelName}
                        className="w-7 h-7 rounded-full border border-border flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text">{channel.channelName}</p>
                        <p className="text-xs text-text-tertiary">
                          {channel.transcriptIds.length} saved {channel.transcriptIds.length === 1 ? "video" : "videos"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.transcripts.length === 0 &&
                results.contentMatches.length === 0 &&
                results.channels.length === 0 && (
                  <div className="p-6 text-center text-text-tertiary">
                    <p className="text-sm">No results for &quot;{query}&quot;</p>
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
