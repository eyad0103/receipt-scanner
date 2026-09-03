import { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { Switch } from "@/components/ui/Switch"
import { Separator } from "@/components/ui/Separator"
import { Button } from "@/components/ui/Button"
import { Tooltip } from "@/components/ui/Tooltip"
import { clearLibrary } from "@/lib/storage"
import { Trash2, Save, RefreshCw } from "lucide-react"
import { useAppContext } from "@/contexts/AppContext"

interface SettingsData {
  autoSave: boolean
  rememberScroll: boolean
  darkMode: boolean
  autoScroll: boolean
  showTimestamps: boolean
}

const SETTINGS_KEY = "tubescript_settings"

export function Settings() {
  const [settings, setSettings] = useState<SettingsData>({
    autoSave: true,
    rememberScroll: false,
    darkMode: true,
    autoScroll: true,
    showTimestamps: true,
  })
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const { toast } = useAppContext()

  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      try {
        setSettings({ ...settings, ...JSON.parse(stored) })
      } catch {
        // continue
      }
    }
  }, [])

  const saveSetting = (key: keyof SettingsData, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
    toast({
      message: `${key}: ${value ? "Enabled" : "Disabled"}`,
      type: "info",
    })
  }

  const handleClearAll = () => {
    clearLibrary()
    setShowClearConfirm(false)
    toast({
      title: "Data Cleared",
      message: "All transcripts, channels, and favorites have been removed.",
      type: "warning",
    })
    setTimeout(() => {
      window.location.href = "/"
    }, 100)
  }

  return (
    <div className="flex-1 h-screen bg-background overflow-y-auto">
      <div className="max-w-3xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text mb-2">Settings</h1>
          <p className="text-sm text-text-tertiary">
            Customize how TubeScript works for you
          </p>
        </div>

        <div className="space-y-10">
          <div>
            <h2 className="text-lg font-medium text-text mb-4 pb-2 border-b border-border">Preferences</h2>
            <div className="space-y-4">
              <Tooltip content="Automatically save transcripts when fetched. This ensures your reading list persists between sessions." className="block w-full">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-text">Auto-save transcripts to Library</p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Automatically save transcripts when fetched
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoSave}
                    onChange={(checked) => saveSetting("autoSave", checked)}
                  />
                </div>
              </Tooltip>

              <Tooltip content="Remember your scroll position in each transcript when you return to it." className="block w-full">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-text">Remember scroll position</p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Remember where you left off in each transcript
                    </p>
                  </div>
                  <Switch
                    checked={settings.rememberScroll}
                    onChange={(checked) => saveSetting("rememberScroll", checked)}
                  />
                </div>
              </Tooltip>

              <Tooltip content="Always use dark theme. System preference is used by default." className="block w-full">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-text">Dark mode</p>
                    <p className="text-xs text-text-tertiary mt-0.5">Always use dark theme</p>
                  </div>
                  <Switch
                    checked={settings.darkMode}
                    onChange={(checked) => saveSetting("darkMode", checked)}
                  />
                </div>
              </Tooltip>
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-lg font-medium text-text mb-4 pb-2 border-b border-border">Transcript Display</h2>
            <div className="space-y-4">
              <Tooltip content="Automatically scroll to follow along with the current segment as you navigate." className="block w-full">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-text">Auto-scroll to current segment</p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Follow along as you read
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoScroll}
                    onChange={(checked) => saveSetting("autoScroll", checked)}
                  />
                </div>
              </Tooltip>

              <Tooltip content="Show time markers for each segment in the transcript." className="block w-full">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-text">Show timestamps</p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Display time markers for each segment
                    </p>
                  </div>
                  <Switch
                    checked={settings.showTimestamps}
                    onChange={(checked) => saveSetting("showTimestamps", checked)}
                  />
                </div>
              </Tooltip>
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-lg font-medium text-text mb-4 pb-2 border-b border-border">Storage</h2>
            <div className="space-y-4">
              <Tooltip content="Remove all transcripts, channels, and favorites from your local library. This action cannot be undone." className="block w-full">
                <Card className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-text">Clear all data</p>
                      <p className="text-xs text-text-tertiary mt-0.5">
                        Remove all transcripts, channels, and favorites
                      </p>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setShowClearConfirm(true)}
                      title="Clear all data"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="ml-1.5">Clear all</span>
                    </Button>
                  </div>
                </Card>
              </Tooltip>

              {showClearConfirm && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                  <Card className="p-6 max-w-sm w-full">
                    <h3 className="text-lg font-medium text-text mb-2">Clear all data?</h3>
                    <p className="text-sm text-text-tertiary mb-6">
                      This will permanently remove all transcripts, channels, and favorites from your library.
                      This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-end">
                      <Button variant="secondary" size="sm" onClick={() => setShowClearConfirm(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleClearAll}
                      >
                        Clear all data
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-lg font-medium text-text mb-4 pb-2 border-b border-border">Keyboard Shortcuts</h2>
            <Card className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-text-tertiary">Focus URL input</span>
                  <kbd className="px-2 py-1 text-xs bg-surface border border-border rounded">Ctrl+L</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-tertiary">Global search</span>
                  <kbd className="px-2 py-1 text-xs bg-surface border border-border rounded">Ctrl+K</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-tertiary">Search transcript</span>
                  <kbd className="px-2 py-1 text-xs bg-surface border border-border rounded">Ctrl+F</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-tertiary">Export transcript</span>
                  <kbd className="px-2 py-1 text-xs bg-surface border border-border rounded">Ctrl+S</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-tertiary">Favorite transcript</span>
                  <kbd className="px-2 py-1 text-xs bg-surface border border-border rounded">Ctrl+D</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-tertiary">Navigate tabs</span>
                  <kbd className="px-2 py-1 text-xs bg-surface border border-border rounded">Alt+1–9</kbd>
                </div>
              </div>
            </Card>
          </div>

          <Separator />

          <div>
            <h2 className="text-lg font-medium text-text mb-4 pb-2 border-b border-border">About</h2>
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-text-tertiary">Version</span>
                  <span className="text-sm text-text">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-text-tertiary">Storage</span>
                  <span className="text-sm text-text">Local Browser Storage</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
