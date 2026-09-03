

export class TranscriptError extends Error {
  public readonly code: string
  public readonly userMessage: string

  constructor(code: string, userMessage: string, originalError?: Error) {
    super(userMessage)
    this.name = "TranscriptError"
    this.code = code
    this.userMessage = userMessage
    if (originalError) {
      this.stack = originalError.stack
    }
  }
}

export const ERROR_CODES = {
  INVALID_URL: "INVALID_URL",
  VIDEO_UNAVAILABLE: "VIDEO_UNAVAILABLE",
  TRANSCRIPT_UNAVAILABLE: "TRANSCRIPT_UNAVAILABLE",
  CAPTIONS_DISABLED: "CAPTIONS_DISABLED",
  PRIVATE_VIDEO: "PRIVATE_VIDEO",
  VIDEO_REMOVED: "VIDEO_REMOVED",
  AGE_RESTRICTED: "AGE_RESTRICTED",
  NETWORK_ERROR: "NETWORK_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const

export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.INVALID_URL]: "Please enter a valid YouTube video URL.",
  [ERROR_CODES.VIDEO_UNAVAILABLE]: "This video is unavailable.",
  [ERROR_CODES.TRANSCRIPT_UNAVAILABLE]: "A transcript is not available for this video.",
  [ERROR_CODES.CAPTIONS_DISABLED]: "Captions are disabled for this video.",
  [ERROR_CODES.PRIVATE_VIDEO]: "This video is private and cannot be accessed.",
  [ERROR_CODES.VIDEO_REMOVED]: "This video has been removed.",
  [ERROR_CODES.AGE_RESTRICTED]: "This video is age-restricted and cannot be accessed.",
  [ERROR_CODES.NETWORK_ERROR]: "A network error occurred. Please check your connection and try again.",
  [ERROR_CODES.UNKNOWN_ERROR]: "Something went wrong. Please try again.",
}

export function createTranscriptError(code: string, originalError?: Error): TranscriptError {
  const message = ERROR_MESSAGES[code] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR]
  return new TranscriptError(code, message, originalError)
}

export function isTranscriptError(error: unknown): error is TranscriptError {
  return error instanceof TranscriptError
}

export function getErrorMessage(error: unknown): string {
  if (isTranscriptError(error)) {
    return error.userMessage
  }
  if (error instanceof Error) {
    return error.message
  }
  return ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR]
}
