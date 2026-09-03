import { useState, useMemo } from "react"
import { Card } from "@/components/ui/Card"
import { EmptyState } from "@/components/ui/EmptyState"
import { Tooltip } from "@/components/ui/Tooltip"
import { loadLibrary, removeDownload, clearDownloads } from "@/lib/storage"
import { LibraryState } from "@/data/types"
import { Download, Trash2, FileText, FileDown, Calendar, HardDrive, Folder, Copy, ExternalLink } from "lucide-react"
import { useAppContext } from "@/contexts/AppContext"

export function Downloads() {
  const [state, setState] = useState<LibraryState>(loadLibrary())
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useAppContext()

  const downloads = useMemo(() => {
    let result = state.downloads.sort(
      (a, b) => new Date(b.exportedAt).getTime() - new Date(a.exportedAt).getTime(),
    )

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (d) =>
          d.filename.toLowerCase().includes(query) ||
          d.videoId.toLowerCase().includes(query) ||
          d.format.toLowerCase().includes(query),
      )
    }

    return result
  }, [state.downloads, searchQuery])

  const handleDelete = (id: string) => {
    removeDownload(id)
    setState(loadLibrary())
    toast({
      message: "Download entry removed",
      type: "info",
    })
  }

  const handleClearAll = () => {
    clearDownloads()
    setState(loadLibrary())
    toast({
      title: "All Downloads Cleared",
      message: "All download entries have been removed.",
      type: "warning",
    })
  }

  const handleCopyPath = (download: typeof downloads[0]) => {
    navigator.clipboard.writeText(download.filename)
    toast({ message: "Filename copied to clipboard", type: "success" })
  }

  const handleOpenFolder = () => {
    toast({
      title: "Downloads folder",
      message: "Files are saved to your browser's download directory.",
      type: "info",
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFormatIcon = (format: string) => {
    if (format === "md") return <FileText className="w-4 h-4" />
    return <FileDown className="w-4 h-4" />
  }

  if (downloads.length === 0 && !searchQuery) {
    return (
      <div className="flex-1 h-screen bg-background overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text mb-2">Downloads</h1>
            <p className="text-sm text-text-tertiary">No exported files</p>
          </div>
          <EmptyState
            title="No downloads"
            description="Exported transcripts will appear here"
            icon={<Download className="w-8 h-8 text-text-tertiary" />}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 h-screen bg-background overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text mb-2">Downloads</h1>
            <p className="text-sm text-text-tertiary">
              {downloads.length} exported file{downloads.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search downloads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-3 py-2 text-sm bg-surface border border-border rounded-md text-text placeholder:text-text-tertiary focus:outline-none focus:border-text-tertiary transition-colors"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {downloads.length > 0 && (
              <Tooltip content="Remove all download entries">
                <button
                  onClick={handleClearAll}
                  className="text-sm text-text-tertiary hover:text-text transition-colors"
                  title="Clear all downloads"
                >
                  Clear all
                </button>
              </Tooltip>
            )}
          </div>
        </div>

        {downloads.length === 0 ? (
          <EmptyState
            title="No downloads match your search"
            description="Try a different search term"
            icon={<Download className="w-8 h-8 text-text-tertiary" />}
          />
        ) : (
          <div className="space-y-2">
            {downloads.map((download) => (
              <Card key={download.id} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-surface border border-border rounded flex-shrink-0">
                    {getFormatIcon(download.format)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-text break-all">
                      {download.filename}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-text-tertiary">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {formatFileSize(download.fileSize)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(download.exportedAt).toLocaleDateString()}
                      </span>
                      <span className="uppercase">{download.format}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Tooltip content="Open folder containing this file">
                      <button
                        onClick={handleOpenFolder}
                        className="p-1 rounded text-text-tertiary hover:text-text hover:bg-border transition-colors"
                        title="Open folder"
                      >
                        <Folder className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Copy filename">
                      <button
                        onClick={() => handleCopyPath(download)}
                        className="p-1 rounded text-text-tertiary hover:text-text hover:bg-border transition-colors"
                        title="Copy path"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Open on YouTube (video reference)">
                      <button
                        onClick={() => window.open(`https://www.youtube.com/watch?v=${download.videoId}`, "_blank")}
                        className="p-1 rounded text-text-tertiary hover:text-text hover:bg-border transition-colors"
                        title="Open source video"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Delete entry">
                      <button
                        onClick={() => handleDelete(download.id)}
                        className="p-1 rounded text-text-tertiary hover:text-[#ff453a] transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
