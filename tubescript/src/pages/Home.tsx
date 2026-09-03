import { useState } from "react"
import { Search, Menu, User, Sun, Moon, Palette, Star } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { useNavigate } from "react-router-dom"
import { useAppContext } from "@/contexts/AppContext"
import { MOCK_VIDEO_ID } from "@/data/mockData"

export function Home() {
  const [url, setUrl] = useState("")
  const navigate = useNavigate()
  const { toast } = useAppContext()

  const handleAnalyze = () => {
    if (!url.trim()) return

    toast({
      title: "Analyzing Video",
      message: "TubeScript is analyzing the video and building your workspace...",
      type: "info",
      duration: 5000,
    })

    setTimeout(() => {
      navigate(`/workspace/${MOCK_VIDEO_ID}`)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background text-text overflow-hidden">
      <nav className="p-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6" />
            <h1 className="font-bold text-2xl">TubeScript</h1>
          </div>
          <Button variant="ghost" onClick={() => setUrl("")}>
            New Analysis
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-12 h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
            Understand every second.
          </h2>
          <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            {"Turn YouTube videos into interactive transcripts, searchable ideas, notes, and insights."}
          </p>

          <div className="space-y-4">
            <div>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a YouTube URL..."
                icon={<Search className="w-5 h-5" />}
                className="w-full max-w-lg"
              />
            </div>

            <Button onClick={handleAnalyze}>
              <Star className="w-4 h-4 mr-2" />
              Analyze Video
            </Button>

            <div className="mt-8 pt-8 border-t border-border/30">
              <p className="text-sm text-text-tertiary">
                {"Supported: youtube.com/watch, youtu.be, youtube.com/shorts"}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}