# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-07-14

### Added
- Screen capture via `getDisplayMedia` with configurable video quality (480p / 720p / 1080p).
- Microphone capture via `getUserMedia` with echo cancellation, noise suppression, and auto gain control.
- Optional system-audio capture where supported by the browser.
- Real-time audio mixing (mic + system audio) via the WebAudio API.
- Pause / Resume / Stop controls with pause-aware duration timer.
- Instant in-browser preview after recording.
- One-click WebM download with an ISO-8601 timestamped filename.
- Live REC badge and animated status pill.
- Keyboard shortcuts: `R` to start/stop, `Space` to pause/resume.
- `beforeunload` guard while recording or with an unsaved preview.
- Vercel deployment config with cache-control and security headers.

### Design
- Custom dark UI with glass-morphism panels and an animated ambient background.
- Fully responsive layout — works down to 360px.
- Reduced-motion support.
