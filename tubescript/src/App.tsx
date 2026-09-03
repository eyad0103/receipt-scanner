import { useState, useEffect } from "react"
import { Routes, Route, useLocation, useNavigate } from "react-router-dom"
import { Sidebar } from "@/components/Sidebar"
import { WorkspacePage } from "@/pages/WorkspacePage"
import { Library } from "@/pages/Library"
import { Channels } from "@/pages/Channels"
import { ChannelView } from "@/pages/ChannelView"
import { Recent } from "@/pages/Recent"
import { Favorites } from "@/pages/Favorites"
import { Downloads } from "@/pages/Downloads"
import { Settings } from "@/pages/Settings"
import { Home } from "@/pages/Home"
import { ToastContainer } from "@/components/ui/Toast"
import { AppProvider, useAppContext } from "@/contexts/AppContext"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { GlobalSearch } from "@/components/GlobalSearch"

function AppContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showGlobalSearch, setShowGlobalSearch] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { clearSearchResults } = useAppContext()

  useEffect(() => {
    setSearchQuery("")
  }, [location.pathname])

  const hasSearchResults = searchQuery.length > 0

  const handleGlobalSearch = () => {
    setShowGlobalSearch((prev) => !prev)
    if (showGlobalSearch) {
      clearSearchResults()
    }
  }

  const focusUrlInput = () => {
    if (location.pathname !== "/") {
      navigate("/")
    }
    setShowGlobalSearch(false)
    clearSearchResults()
    setTimeout(() => {
      const urlInput = document.querySelector('input[placeholder*="YouTube"]') as HTMLInputElement
      urlInput?.focus()
    }, 100)
  }

  useKeyboardShortcuts({
    focusUrlInput,
    globalSearch: handleGlobalSearch,
    exportTranscript: () => {
      if (location.pathname.startsWith("/transcript/")) {
        const exportBtn = document.querySelector('[title="Export"]') as HTMLButtonElement
        exportBtn?.click()
      }
    },
    favoriteTranscript: () => {
      if (location.pathname.startsWith("/transcript/")) {
        const favBtn = document.querySelector('[title*="avorite"]') as HTMLButtonElement
        favBtn?.click()
      }
    },
  })

  return (
    <div className="flex h-screen bg-background text-text overflow-hidden">
      <Sidebar
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        hasSearchResults={hasSearchResults}
      />
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/workspace/:videoId" element={<WorkspacePage />} />
          <Route path="/library" element={<Library />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/channels/:channelId" element={<ChannelView />} />
          <Route path="/recent" element={<Recent />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
      {showGlobalSearch && (
        <GlobalSearch
          onClose={() => setShowGlobalSearch(false)}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      {({ toasts, removeToast }) => (
        <>
          <AppContent />
          <ToastContainer toasts={toasts} onRemove={removeToast} />
        </>
      )}
    </AppProvider>
  )
}
