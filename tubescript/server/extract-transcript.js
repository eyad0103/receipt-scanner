const fetch = require("node-fetch")

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

const videoId = process.argv[2] || "PRp5Y543LN0"

async function fetchPlayerResponse(videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}`
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  })

  const html = await response.text()

  const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]*?\});/)

  if (match && match[1]) {
    try {
      const data = JSON.parse(match[1])
      if (data.captions) {
        console.log("Found captions!")
        console.log("Tracks:", JSON.stringify(data.captions.playerCaptionsTracklistRenderer?.captionTracks?.length || 0))
        const tracks = data.captions.playerCaptionsTracklistRenderer?.captionTracks
        if (tracks) {
          for (const track of tracks) {
            console.log("Track:", JSON.stringify({
              languageCode: track.languageCode,
              name: track.name?.simpleText,
              isDraft: track.isDraft,
              baseUrl: track.baseUrl ? track.baseUrl.substring(0, 100) + "..." : null
            }))
          }
        }
      } else {
        console.log("No captions in response")
        console.log("Keys:", Object.keys(data))
      }
    } catch (e) {
      console.log("Parse error:", e.message)
    }
  } else {
    console.log("No ytInitialPlayerResponse found")
    console.log("HTML length:", html.length)
  }
}

fetchPlayerResponse(videoId)
