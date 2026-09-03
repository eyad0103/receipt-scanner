import { useState, useEffect, ReactNode, useCallback } from "react"
import { useToast as useToastInternal } from "@/components/ui/Toast"

interface ToastFunction {
  (props: {
    title?: string
    message: string
    type?: "info" | "success" | "warning" | "error"
    duration?: number
    action?: { label: string; onClick: () => void }
  }): void
}

interface AppContextType {
  lastActiveTab: string
  setLastActiveTab: (tab: string) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  searchHistory: string[]
  addToSearchHistory: (query: string) => void
  clearSearchResults: () => void
  toast: ToastFunction
}

import { createContext, useContext } from "react"

const AppContext = createContext<AppContextType | null>(null)

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider")
  }
  return context
}

const SIDEBAR_STATE_KEY = "tubescript_sidebar"
const LAST_TAB_KEY = "tubescript_last_tab"
const SEARCH_HISTORY_KEY = "tubescript_search_history"
const MAX_SEARCH_HISTORY = 20

interface AppProviderProps {
  children: (props: { 
    toasts: ReturnType<typeof useToastInternal>['toasts']
    removeToast: ReturnType<typeof useToastInternal>['removeToast']
  }) => ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [lastActiveTab, setLastActiveTabState] = useState(() => {
    return localStorage.getItem(LAST_TAB_KEY) || "home"
  })
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(() => {
    return localStorage.getItem(SIDEBAR_STATE_KEY) === "collapsed"
  })
  const [searchHistory, setSearchHistoryState] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [clearSearchTrigger, setClearSearchTrigger] = useState(0)

  const { toasts, addToast, removeToast } = useToastInternal()

  const setLastActiveTab = useCallback((tab: string) => {
    setLastActiveTabState(tab)
    localStorage.setItem(LAST_TAB_KEY, tab)
  }, [])

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed)
    localStorage.setItem(SIDEBAR_STATE_KEY, collapsed ? "collapsed" : "expanded")
  }, [])

  const addToSearchHistory = useCallback((query: string) => {
    if (!query.trim()) return
    setSearchHistoryState((prev) => {
      const newHistory = [query, ...prev.filter((q) => q !== query)].slice(0, MAX_SEARCH_HISTORY)
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
      return newHistory
    })
  }, [])

  const clearSearchResults = useCallback(() => {
    setClearSearchTrigger((prev) => prev + 1)
  }, [])

  const toast = useCallback<ToastFunction>((props) => {
    addToast(props)
  }, [addToast])

  const value: AppContextType = {
    lastActiveTab,
    setLastActiveTab,
    sidebarCollapsed,
    setSidebarCollapsed,
    searchHistory,
    addToSearchHistory,
    clearSearchResults,
    toast,
  }

  return (
    <AppContext.Provider value={value}>
      {children({ toasts, removeToast })}
    </AppContext.Provider>
  )
}
