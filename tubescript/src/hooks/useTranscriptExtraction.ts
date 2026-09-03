import { useState, useCallback } from "react"
import { fetchTranscript, isTranscriptError } from "@/services/transcriptService"
import type { TranscriptData } from "@/data/types"
import type { TranscriptError } from "@/data/errors"
import { validateYouTubeUrl } from "@/lib/url"

type ExtractionStatus = "idle" | "fetching" | "loaded" | "error"

export function useTranscriptExtraction() {
  const [data, setData] = useState<TranscriptData | null>(null)
  const [error, setError] = useState<TranscriptError | null>(null)
  const [status, setStatus] = useState<ExtractionStatus>("idle")

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setStatus("idle")
  }, [])

  const extract = useCallback(
    async (input: string) => {
      const result = validateYouTubeUrl(input)
      if (!result.valid || !result.videoId) {
        const err = {
          name: "TranscriptError",
          code: "INVALID_URL",
          userMessage: result.error || "Invalid URL",
        } as TranscriptError
        setError(err)
        setStatus("error")
        return null
      }

      setStatus("fetching")
      setError(null)

      try {
        const transcript = await fetchTranscript(result.videoId)
        setData(transcript)
        setStatus("loaded")
        return transcript
      } catch (e) {
        if (isTranscriptError(e)) {
          setError(e)
          setStatus("error")
        } else {
          const err = {
            name: "TranscriptError",
            code: "UNKNOWN_ERROR",
            userMessage: "Something went wrong while fetching the transcript.",
          } as TranscriptError
          setError(err)
          setStatus("error")
        }
        return null
      }
    },
    [],
  )

  return {
    data,
    error,
    status,
    extract,
    isIdle: status === "idle",
    isLoading: status === "fetching",
    reset,
  }
}
