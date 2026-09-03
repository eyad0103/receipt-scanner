const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/(?:watch|embed|v|live_stream|shorts)|youtu\.be\/|yt\.be\/)(?:[?&]v=)?([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
]

const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/

function extractFromPattern(url: string, pattern: RegExp): string | null {
  const match = url.match(pattern)
  return match ? match[1] : null
}

export function extractVideoId(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  for (const pattern of YOUTUBE_PATTERNS) {
    const id = extractFromPattern(trimmed, pattern)
    if (id && VIDEO_ID_PATTERN.test(id)) {
      return id
    }
  }

  return null
}

export function isValidYouTubeUrl(url: string): boolean {
  const id = extractVideoId(url)
  if (!id) return false

  try {
    const parsed = new URL(url.trim())
    const hostname = parsed.hostname.replace(/^www\./, "")

    const validHosts = [
      "youtube.com",
      "youtu.be",
      "m.youtube.com",
      "m.youtu.be",
      "yt.be",
    ]

    return validHosts.includes(hostname)
  } catch {
    return false
  }
}

export function isVideoId(input: string): boolean {
  return VIDEO_ID_PATTERN.test(input.trim())
}

export function normalizeInput(input: string): string {
  const trimmed = input.trim()
  if (isVideoId(trimmed)) {
    return `https://www.youtube.com/watch?v=${trimmed}`
  }
  return trimmed
}

export interface UrlValidationResult {
  valid: boolean
  videoId: string | null
  error: string | null
}

export function validateYouTubeUrl(input: string): UrlValidationResult {
  const normalized = normalizeInput(input)

  if (!normalized) {
    return { valid: false, videoId: null, error: "Please enter a YouTube URL or video ID." }
  }

  if (!isValidYouTubeUrl(normalized)) {
    return { valid: false, videoId: null, error: "Please enter a valid YouTube video URL." }
  }

  const videoId = extractVideoId(normalized)
  if (!videoId) {
    return { valid: false, videoId: null, error: "Could not extract video ID from the URL." }
  }

  return { valid: true, videoId, error: null }
}
