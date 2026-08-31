# CluDari — Electron Packaging

Electron provides the desktop window. Backend stays Python + FastAPI.

## Prerequisites

- Node.js 18+
- Python 3.10+ with: `pip install -r requirements.txt`

## Dev run

```bash
cd electron
npm install
npm start
```

Or from project root:

- Windows: `run-electron.bat`
- macOS/Linux: `./run-electron.sh`

## Build installers

```bash
cd electron
npm install
npm run dist:win     # Windows .exe
npm run dist:mac     # macOS .dmg
npm run dist:linux   # AppImage + .deb
```

Output: `electron/dist/`

## Environment

| Variable | Default | Meaning |
|----------|---------|---------|
| CLU_PYTHON | python / python3 | Python executable |
| CLU_PORT | 8000 | Server port |
