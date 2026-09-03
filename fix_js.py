#!/usr/bin/env python3

# Read the file
with open('C:/Users/Eyad/.opencode/bin/tubescript/src/pages/TranscriptViewer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the clipboard writeText calls by replacing template literals with concatenation
# This is a simple approach - replace problematic patterns

# 1. Replace the handleSegmentClick function
old_pattern1 = 'window.open(`https://www.youtube.com/watch?v=${transcript?.videoId}&t=${timeInSeconds}s", "_blank`)'
new_value1 = 'window.open("https://www.youtube.com/watch?v=" + transcript?.videoId + "&t=" + timeInSeconds + "s", "_blank")'

if old_pattern1 in content:
    content = content.replace(old_pattern1, new_value1)

# 2. Replace the handleTimestampCopy function
old_pattern2 = 'navigator.clipboard.writeText(`[${timeString}] ${segment.text}`)'
new_value2 = 'navigator.clipboard.writeText("[" + timeString + "] " + segment.text)'

if old_pattern2 in content:
    content = content.replace(old_pattern2, new_value2)

# 3. Replace the Copy Video URL onClick
old_pattern3 = 'navigator.clipboard.writeText("https://www.youtube.com/watch?v=" + transcript.videoId)}'
new_value3 = 'navigator.clipboard.writeText("https://www.youtube.com/watch?v=" + transcript.videoId)'

if old_pattern3 in content:
    content = content.replace(old_pattern3, new_value3)

# Write the fixed content back
with open('C:/Users/Eyad/.opencode/bin/tubescript/src/pages/TranscriptViewer.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed TranscriptViewer.tsx using Python")
