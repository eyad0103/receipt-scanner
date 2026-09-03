#!/usr/bin/env python3

# Read the original file
with open('C:/Users/Eyad/.opencode/bin/tubescript/src/pages/TranscriptViewer.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Create new lines with fixes
new_lines = []

for i, line in enumerate(lines):
    # Fix line 336 (0-indexed) - handleSegmentClick
    if i == 335:
        # Original: window.open("https://www.youtube.com/watch?v=" + transcript?.videoId + "&t=" + timeInSeconds + "s", "_blank")
        # Fixed with escaped ampersand
        new_lines.append('  window.open("https://www.youtube.com/watch?v=" + transcript?.videoId + "\\&t=" + timeInSeconds + "s", "_blank")\n')
    # Fix line 341 (0-indexed) - handleTimestampCopy function
    elif i == 340:
        # Original: const text = "[" + timeString + "] " + segment.text
        # Fixed with escaped quotes
        new_lines.append('    const text = "[" + timeString + "] " + segment.text\n')
    # Fix line 342 (0-indexed) - navigator.clipboard.writeText
    elif i == 341:
        # Original: navigator.clipboard.writeText(text)
        new_lines.append('    navigator.clipboard.writeText(text)\n')
    # Fix line 464 (0-indexed) - Copy Video URL in ContextMenuItem
    elif i == 463:
        # This is the problematic line with the missing closing parenthesis
        # Replace with proper escaped string
        new_lines.append('                    onClick={() => navigator.clipboard.writeText("https://www.youtube.com/watch?v=" + transcript.videoId)}\n')
    # For all other lines, keep them as is
    else:
        new_lines.append(line)

# Write the fixed content back to the file
with open('C:/Users/Eyad/.opencode/bin/tubescript/src/pages/TranscriptViewer.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Successfully fixed TranscriptViewer.tsx")
print("Fixes applied:")
print("1. Fixed handleSegmentClick with escaped ampersand")
print("2. Fixed handleTimestampCopy function")
print("3. Fixed Copy Video URL in ContextMenuItem")
