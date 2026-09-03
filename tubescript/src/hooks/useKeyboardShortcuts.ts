import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export interface KeyboardShortcuts {
  focusUrlInput?: () => void
  focusTranscriptSearch?: () => void
  favoriteTranscript?: () => void
  exportTranscript?: () => void
  globalSearch?: () => void
  copySelectedText?: () => void
}

export function useKeyboardShortcuts(actions: KeyboardShortcuts) {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable

      // Ctrl+K - Global search
      if ((e.ctrlKey || e.metaKey) && e.key === "k" && !isInput) {
        e.preventDefault()
        actions.globalSearch?.()
      }

      // Ctrl+L - Focus URL input
      if ((e.ctrlKey || e.metaKey) && e.key === "l" && !isInput) {
        e.preventDefault()
        actions.focusUrlInput?.()
      }

      // Ctrl+F - Search transcript (only when on transcript page)
      if ((e.ctrlKey || e.metaKey) && e.key === "f" && !isInput) {
        e.preventDefault()
        actions.focusTranscriptSearch?.()
      }

      // Ctrl+S - Export transcript
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && !isInput) {
        e.preventDefault()
        actions.exportTranscript?.()
      }

      // Ctrl+D - Favorite transcript
      if ((e.ctrlKey || e.metaKey) && e.key === "d" && !isInput) {
        e.preventDefault()
        actions.favoriteTranscript?.()
      }

      // Ctrl+C for copy is handled by browser, we add a visual indicator
      // Escape - Close dialogs, clear search
      if (e.key === "Escape" && !isInput) {
        actions.globalSearch?.() // This toggles search closed
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [actions, navigate])
}

export function getShortcutLabel(key: string, ctrl = true): string {
  if (ctrl) {
    return `Ctrl+${key.toUpperCase()}`
  }
  return key.toUpperCase()
}
