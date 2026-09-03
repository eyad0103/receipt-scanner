# Development Notes — Informal Frog Macro

This document records verified observations about Informal Frog Macro. Every observation is marked with a status. Future development should reference this document before implementing any feature.

## Status Legend

| Status | Description |
|--------|-------------|
| **Verified** | Confirmed by direct inspection of Informal Frog Macro source code or runtime behavior. |
| **Observed** | Seen in logs, network traces, or behavior. Not confirmed at the code level but consistently reproducible. |
| **Hypothesis** | Plausible based on indirect evidence but not yet confirmed. Must not be implemented as fact. |
| **Unknown** | Not yet investigated or observed. |

---

## Project Overview

**Status:** Verified

- Informal Frog Macro is a Flutter-based Windows desktop application.
- The application is structured with directories: assets, config, logs, cache, profiles, lib, scripts.
- Application name: "Informal Frog Macro".
- Version: 1.0.0.

---

## Window Behavior

**Status:** Verified

- The application uses a resizable window on Windows.
- Window position and size are persisted across launches via config.json.
- The window uses the native Windows title bar (no custom-drawn title bar).
- Default window size: 1280x720 pixels.
- Minimum window size enforced: 800x600 pixels.

---

## Configuration System

**Status:** Verified

- Configuration is stored in `config/config.json`.
- Generated automatically on first launch if it does not exist.
- Configuration keys:
  - `version` — Application version string.
  - `theme` — UI theme ("dark" or "light").
  - `debugEnabled` — Boolean for debug mode.
  - `logLevel` — Logging level ("debug", "info", "warning", "error").
  - `windowWidth` — Window width in pixels.
  - `windowHeight` — Window height in pixels.
  - `windowX` — Window X position.
  - `windowY` — Window Y position.
  - `firstLaunch` — Boolean flag for first launch tracking.

---

## Logging System

**Status:** Verified

- Logs are written to `logs/` directory.
- A new log file is created on each application start (filename: `YYYY-MM-DD.log`).
- Previous log files are preserved.
- Every startup step is logged in sequence:
  1. "Application Starting"
  2. "Loading Configuration"
  3. "Creating Directories"
  4. "Loading Assets"
  5. "Loading Fonts"
  6. "Initializing Services"
  7. "Opening Main Window"
  8. "Application Ready"
- All log entries include timestamp, level, and message.
- Format: `[YYYY-MM-DD HH:MM:SS.mmm] [LEVEL] message`
- Debug mode (when enabled) sets log level to "debug" and includes additional diagnostic messages.

---

## User Interface

**Status:** Verified

- Left sidebar navigation with four items:
  - Dashboard
  - Logs
  - Settings
  - About
- No additional pages or navigation items exist in Phase 1.

### Dashboard

- Displays application status (Running/Stopped).
- Displays current version number.
- Displays configuration load status (Loaded/Not Loaded).
- Displays log system status (Ready).
- Other automation features are listed as "Not Implemented":
  - OCR Engine
  - Vision Engine
  - Automation Manager
  - Game State

### Logs Page

- Displays live log entries in reverse chronological order (newest at bottom).
- Contains a search field for filtering log entries.
- Contains Export and Clear buttons (disabled in Phase 1).
- Auto-scrolls to the newest entry when at the bottom.
- Auto-scroll pauses when user manually scrolls up.

### Settings Page

- Theme selector (dark/light dropdown).
- Debug Mode toggle.
- Settings are saved immediately on change.

### About Page

- Displays: Application Name, Version, Build Date, Framework, Operating System.

---

## Automation Components

**Status:** Unknown

No automation components have been verified in Phase 1. The following items must NOT be implemented until verified:

- OCR Engine — Unknown
- Vision Engine — Unknown
- Automation Manager — Unknown
- GameState classes — Unknown
- Informal Engine API — Unknown
- Macro scripting system — Unknown

---

## Informal Frog Macro Internal Behavior

**Status:** Unknown

- How Informal Frog Macro communicates with the game client — Unknown
- How Informal Frog Macro performs OCR — Unknown
- How Informal Frog Macro performs vision detection — Unknown
- How Informal Frog Macro executes macros — Unknown
- Whether Informal Frog Macro uses external scripts — Unknown
- What game(s) Informal Frog Macro targets — Unknown

---

## Build & Deployment

**Status:** Verified

- Application builds with `flutter build windows --release`.
- Launcher (`launcher.bat`) verifies project folders, creates missing directories, checks write permissions, and launches the application.
- Run script (`run.bat`) launches in development mode.
- Application exit codes are captured and displayed by the launcher.

---

## Future Invariants

- No automation code will be added until Informal Frog Macro behavior is verified.
- No placeholder implementations will be created.
- No speculative architecture (e.g., abstract base classes for unknown systems).
- Every new component must have at least one "Hypothesis" or "Observed" entry in this document before implementation.
