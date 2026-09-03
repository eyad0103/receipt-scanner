import { NavLink, useLocation, useNavigate } from "react-router-dom"
import {
  Home,
  Library,
  Tv,
  Clock,
  Heart,
  Download,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react"
import { useAppContext } from "@/contexts/AppContext"
import { Tooltip } from "@/components/ui/Tooltip"
import { useEffect } from "react"

interface SidebarProps {
  onSearch: (query: string) => void
  searchQuery: string
  hasSearchResults: boolean
}

export function Sidebar({ onSearch, searchQuery, hasSearchResults }: SidebarProps) {
  const { setLastActiveTab, sidebarCollapsed, setSidebarCollapsed, toast } = useAppContext()
  const location = useLocation()
  const navigate = useNavigate()

  const tabs = [
    { id: "home", label: "Home", icon: Home, path: "/", shortcut: "Alt+1" },
    { id: "library", label: "Library", icon: Library, path: "/library", shortcut: "Alt+2" },
    { id: "channels", label: "Channels", icon: Tv, path: "/channels", shortcut: "Alt+3" },
    { id: "recent", label: "Recent", icon: Clock, path: "/recent", shortcut: "Alt+4" },
    { id: "favorites", label: "Favorites", icon: Heart, path: "/favorites", shortcut: "Alt+5" },
    { id: "downloads", label: "Downloads", icon: Download, path: "/downloads", shortcut: "Alt+6" },
    { id: "settings", label: "Settings", icon: Settings, path: "/settings", shortcut: "Alt+9" },
  ]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const tab = tabs.find((t) => t.shortcut === `Alt+${e.key}`)
        if (tab) {
          e.preventDefault()
          navigate(tab.path)
          setLastActiveTab(tab.id)
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [navigate, tabs, setLastActiveTab])

  const handleToggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const handleNewSearch = () => {
    navigate("/")
    onSearch("")
    toast({
      title: "New Search",
      message: "Enter a YouTube URL or video ID to get started.",
      type: "info",
    })
  }

  const currentPath = location.pathname

  return (
    <aside
      className={`h-screen bg-background border-r border-border flex flex-col overflow-hidden transition-all duration-300 ${
        sidebarCollapsed ? "w-14" : "w-64"
      }`}
    >
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          {!sidebarCollapsed && (
            <h2 className="font-medium text-xs text-text-tertiary uppercase tracking-wider">
              Navigation
            </h2>
          )}
          <button
            onClick={handleToggleCollapse}
            className={`p-1 rounded hover:bg-border text-text-tertiary hover:text-text transition-colors ${
              sidebarCollapsed ? "mx-auto" : ""
            }`}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search transcripts..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm bg-surface border border-border rounded-md text-text placeholder:text-text-tertiary focus:outline-none focus:border-text-tertiary transition-colors"
            />
          </div>
        )}

        {hasSearchResults && !sidebarCollapsed && (
          <div className="mt-2 px-2">
            <div className="text-xs text-text-tertiary font-medium mb-1">SEARCH RESULTS</div>
            <div className="space-y-1">
              <div className="text-xs text-text-tertiary hover:text-text cursor-pointer px-2 py-1 hover:bg-surface rounded transition-colors">
                View all results
              </div>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        <div className="space-y-1 px-1.5">
          {tabs.map((tab) => (
            <Tooltip
              key={tab.id}
              className="block w-full"
              content={
                <div className="flex flex-col">
                  <span>{tab.label}</span>
                  <kbd className="px-1.5 py-0.5 text-xs bg-border rounded">{tab.shortcut}</kbd>
                </div>
              }
            >
              <NavLink
                to={tab.path}
                onClick={() => setLastActiveTab(tab.id)}
                className={({ isActive }) =>
                  `flex items-center w-full gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 ${
                    isActive
                      ? "bg-white text-black font-medium shadow-sm"
                      : "text-text-tertiary hover:text-text hover:bg-surface"
                  } ${sidebarCollapsed ? "justify-center" : ""}`
                }
              >
                <div className="relative flex items-center justify-center w-5 h-5">
                  <tab.icon
                    className={`w-4 h-4 transition-all duration-200 ${
                      currentPath === tab.path ? "scale-110" : ""
                    }`}
                  />
                  <div
                    className={`absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                      currentPath === tab.path
                        ? "bg-white opacity-100"
                        : "bg-transparent opacity-0"
                    }`}
                  />
                </div>
                {!sidebarCollapsed && <span>{tab.label}</span>}
              </NavLink>
            </Tooltip>
          ))}
        </div>
      </nav>

      <div className="p-3 border-t border-border">
        {!sidebarCollapsed ? (
          <Tooltip content="New search (Ctrl+L)">
            <div
              onClick={handleNewSearch}
              className="flex items-center gap-3 px-3 py-2 text-sm rounded-md cursor-pointer text-text-tertiary hover:text-text hover:bg-surface transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Search</span>
            </div>
          </Tooltip>
        ) : (
          <Tooltip content="New search (Ctrl+L)">
            <div
              onClick={handleNewSearch}
              className="flex justify-center px-3 py-2 rounded-md cursor-pointer text-text-tertiary hover:text-text hover:bg-surface transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
            >
              <Plus className="w-4 h-4" />
            </div>
          </Tooltip>
        )}

        <div className="mt-3 pt-2 border-t border-border">
          <p className={`text-xs text-text-tertiary ${sidebarCollapsed ? "text-center" : "px-3"}`}>
            TubeScript v1.0
          </p>
        </div>
      </div>
    </aside>
  )
}
