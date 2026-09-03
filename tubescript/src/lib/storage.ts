import type { LibraryState, SavedTranscript, ChannelData, DownloadData } from "@/data/types"

const STORAGE_KEY = "tubescript_library"

const defaultState: LibraryState = {
  transcripts: {},
  channels: {},
  favorites: {
    transcripts: [],
    channels: [],
  },
  recent: [],
  downloads: [],
  stats: {
    totalTranscripts: 0,
    totalChannels: 0,
    totalFavorites: 0,
    totalDownloads: 0,
  },
}

export function loadLibrary(): LibraryState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      return { ...defaultState, ...data }
    }
  } catch {
    // continue
  }
  return defaultState
}

export function saveLibrary(state: LibraryState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // continue
  }
}

export function addTranscript(transcript: SavedTranscript): void {
  const state = loadLibrary()
  state.transcripts[transcript.videoId] = transcript

  if (!state.recent.includes(transcript.videoId)) {
    state.recent.unshift(transcript.videoId)
  } else {
    state.recent = state.recent.filter((id) => id !== transcript.videoId)
    state.recent.unshift(transcript.videoId)
  }

  if (transcript.channelId) {
    if (!state.channels[transcript.channelId]) {
      state.channels[transcript.channelId] = {
        channelId: transcript.channelId,
        channelName: transcript.channel,
        channelThumbnail: transcript.channelThumbnail || "",
        transcriptIds: [],
        firstAdded: transcript.addedAt,
        lastViewed: transcript.lastViewedAt,
        isFavorite: false,
      }
    }

    const channel = state.channels[transcript.channelId]
    if (!channel.transcriptIds.includes(transcript.videoId)) {
      channel.transcriptIds.push(transcript.videoId)
    }
    channel.lastViewed = transcript.lastViewedAt
    channel.channelName = transcript.channel
    if (transcript.channelThumbnail && transcript.channelThumbnail !== channel.channelThumbnail) {
      channel.channelThumbnail = transcript.channelThumbnail
    }
  }

  state.stats = {
    totalTranscripts: Object.keys(state.transcripts).length,
    totalChannels: Object.keys(state.channels).length,
    totalFavorites: state.favorites.transcripts.length + state.favorites.channels.length,
    totalDownloads: state.downloads.length,
  }

  saveLibrary(state)
}

export function updateLastViewed(videoId: string): void {
  const state = loadLibrary()
  if (state.transcripts[videoId]) {
    state.transcripts[videoId].lastViewedAt = new Date().toISOString()

    state.recent = state.recent.filter((id) => id !== videoId)
    state.recent.unshift(videoId)
  }

  if (state.channels) {
    for (const channel of Object.values(state.channels)) {
      if (channel.transcriptIds.includes(videoId)) {
        channel.lastViewed = new Date().toISOString()
      }
    }
  }

  saveLibrary(state)
}

export function updateReadingPosition(
  videoId: string,
  segmentId: string,
  percentage: number,
  scrollPosition: number
): void {
  const state = loadLibrary()
  if (state.transcripts[videoId]) {
    state.transcripts[videoId].readingProgress = {
      segmentId,
      percentage,
      lastReadAt: new Date().toISOString(),
      lastPosition: scrollPosition,
    }
    saveLibrary(state)
  }
}

export function getReadingPosition(videoId: string): SavedTranscript["readingProgress"] | null {
  const state = loadLibrary()
  return state.transcripts[videoId]?.readingProgress || null
}

export function toggleFavorite(videoId: string): void {
  const state = loadLibrary()
  const isFav = state.favorites.transcripts.includes(videoId)

  if (isFav) {
    state.favorites.transcripts = state.favorites.transcripts.filter((id) => id !== videoId)
  } else {
    state.favorites.transcripts.push(videoId)
  }

  if (state.transcripts[videoId]) {
    state.transcripts[videoId].isFavorite = !isFav
  }

  state.stats.totalFavorites = state.favorites.transcripts.length + state.favorites.channels.length
  saveLibrary(state)
}

export function toggleChannelFavorite(channelId: string): void {
  const state = loadLibrary()
  const isFav = state.favorites.channels.includes(channelId)

  if (isFav) {
    state.favorites.channels = state.favorites.channels.filter((id) => id !== channelId)
  } else {
    state.favorites.channels.push(channelId)
  }

  if (state.channels[channelId]) {
    state.channels[channelId].isFavorite = !isFav
  }

  state.stats.totalFavorites = state.favorites.transcripts.length + state.favorites.channels.length
  saveLibrary(state)
}

export function removeTranscript(videoId: string): void {
  const state = loadLibrary()
  delete state.transcripts[videoId]

  state.recent = state.recent.filter((id) => id !== videoId)
  state.favorites.transcripts = state.favorites.transcripts.filter((id) => id !== videoId)

  for (const channel of Object.values(state.channels)) {
    channel.transcriptIds = channel.transcriptIds.filter((id) => id !== videoId)
  }

  state.stats.totalTranscripts = Object.keys(state.transcripts).length
  state.stats.totalFavorites = state.favorites.transcripts.length + state.favorites.channels.length
  saveLibrary(state)
}

export function addDownload(download: DownloadData): void {
  const state = loadLibrary()
  state.downloads.unshift(download)
  state.stats.totalDownloads = state.downloads.length
  saveLibrary(state)
}

export function removeDownload(id: string): void {
  const state = loadLibrary()
  state.downloads = state.downloads.filter((d) => d.id !== id)
  state.stats.totalDownloads = state.downloads.length
  saveLibrary(state)
}

export function clearDownloads(): void {
  const state = loadLibrary()
  state.downloads = []
  state.stats.totalDownloads = 0
  saveLibrary(state)
}

export function clearLibrary(): void {
  localStorage.removeItem(STORAGE_KEY)
}
