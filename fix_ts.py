#!/usr/bin/env python3

import re

# Read the file
with open('src/pages/TranscriptViewer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the handleSegmentClick function
# Replace the problematic part
content = re.sub(
    r'window\.open\("https://www.youtube\.com/watch\?v=.*&t=.*"\)',
    'window.open("https://www.youtube.com/watch?v=" + transcript?.videoId + "&t=" + timeInSeconds + "s", "_blank")',
    content
)

# Fix the handleTimestampCopy function
content = re.sub(
    r'navigator\.clipboard\.writeText\(\`\[.*\`\)',
    'navigator.clipboard.writeText("[" + timeString + "] " + segment.text)',
    content
)

# Fix the Copy Video URL onClick
content = re.sub(
    r'navigator\.clipboard\.writeText\("https://www.youtube\.com/watch\?v=.*"\)',
    'navigator.clipboard.writeText("https://www.youtube.com/watch?v=" + transcript.videoId)',
    content
)

# Write the fixed content back
with open('src/pages/TranscriptViewer.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed TranscriptViewer.tsx")
