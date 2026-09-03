import { useState } from "react"
import { Search, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { useAppContext } from "@/contexts/AppContext"

interface TranscriptSearchProps {
  transcript: {
    segments: {
      id: string
      startTime: number
      endTime: number
      text: string
      speaker: string
    }[]
  }
  onSearchChange: (query: string) => void
  onClear: () => void
  active: boolean
}

export function TranscriptSearch({ transcript, onSearchChange, onClear, active }: TranscriptSearchProps) {
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = () => {
    setIsSearching(true)
    const q = query.trim()
    setTimeout(() => {
      setIsSearching(false)
      onSearchChange(q)
    }, 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClear()
      setQuery("")
      setQuery("")
    }
  }

  return (
    <div className="mb-4 pb-4 border-b border-indigo-500/20">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search transcript..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full max-w-xl"
          disabled={isSearching}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSearch}
          className="hidden sm:inline flex items-center gap-1 px-2 py-1 rounded border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 transition-colors"
          disabled={!query.trim() || isSearching}
        >
          {isSearching ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Search className="w-3 h-3" />
          )}
        </Button>
        {active && (
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {isSearching && (
        <p className="text-xs text-indigo-400 mt-1">
          Searching across {transcript.segments.length} segments...
        </p>
      )}
    </div>
  )
}