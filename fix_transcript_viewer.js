const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/TranscriptViewer.tsx');
const content = fs.readFileSync(filePath, 'utf8');

// Fix the handleSegmentClick function
const fixedContent = content
  // Replace the problematic line
  .replace(
    /window\.open\("https:\/\/www\.youtube\.com\/watch\?v=/g,
    'window.open("https://www.youtube.com/watch?v=" + transcript?.videoId + "&t=" + timeInSeconds + "s", "_blank")'
  )
  // Also fix the handleTimestampCopy function
  .replace(
    /const timeString = formatSegmentTime\(segment\.startTime\)\s*\n\s*navigator\.clipboard\.writeText\(\`\[\[/g,
    'const timeString = formatSegmentTime(segment.startTime)\n    const text = "[" + timeString + "] " + segment.text\n    navigator.clipboard.writeText(text)'
  );

fs.writeFileSync(filePath, fixedContent, 'utf8');
console.log('Fixed TranscriptViewer.tsx');
