# Informal Frog Macro

A Windows desktop application for Informal Frog Macro automation.

## Requirements

- Flutter 3.44.0 or later
- Windows 10 or later
- Visual Studio 2022 (with C++ build tools)

## Quick Start

### Option 1: Launcher (Recommended)

```bat
launcher.bat
```

The launcher will:
1. Verify project folder structure
2. Create any missing directories
3. Verify write permissions
4. Generate default configuration if needed
5. Launch the application

### Option 2: Direct Run

```bat
run.bat
```

Launches the application in development mode.

## Project Structure

```
project_root/
├── assets/
│   ├── images/
│   ├── icons/
│   ├── templates/
│   └── fonts/
├── config/
│   └── config.json
├── logs/
│   └── YYYY-MM-DD.log
├── cache/
├── profiles/
├── lib/
│   ├── app/
│   │   └── pages/
│   ├── core/
│   ├── ui/
│   ├── services/
│   ├── models/
│   └── widgets/
├── scripts/
├── launcher.bat
├── run.bat
└── README.md
```

## Configuration

On first launch, the application automatically generates `config/config.json` with:

| Key | Type | Description |
|-----|------|-------------|
| version | String | Application version |
| theme | String | UI theme ("dark" or "light") |
| debugEnabled | Boolean | Enable debug logging |
| logLevel | String | Minimum log level |
| windowWidth | Integer | Window width in pixels |
| windowHeight | Integer | Window height in pixels |
| windowX | Integer | Window X position |
| windowY | Integer | Window Y position |
| firstLaunch | Boolean | First launch flag |

## Logging

- Log files are stored in the `logs/` directory.
- A new log file is created for each day (`YYYY-MM-DD.log`).
- All startup steps are logged with timestamps.
- Debug mode enables verbose logging.

## Development

See `DEVELOPMENT_NOTES.md` for verified observations and invariants.
