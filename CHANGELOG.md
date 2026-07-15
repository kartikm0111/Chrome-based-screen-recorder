# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] — 2026-07-14

### Added
- **Webcam-only recording mode** — a Recording-mode selector (Screen / Webcam only) at the top of the Sources panel; webcam mode records the camera directly with no screen share, hiding the system-audio and PiP options that don't apply.

### Removed (from roadmap)
- Cloud upload adapters — deliberately dropped to keep the app 100 % client-side and private.
- Annotation tools — not practical without a live capture preview; may revisit in a future design.

## [1.1.0] — 2026-07-14

### Added
- **Webcam picture-in-picture overlay** — a circular face-cam bubble composited live onto the recording via a canvas pipeline; position selectable (any corner).
- **Countdown before recording** — optional 3 / 5 / 10-second full-screen countdown; cancellable with the Stop button.
- **In-browser trim** — dual-slider range selection with live preview seeking and a progress readout; the trimmed clip replaces the preview and download.
- **MP4 export** — an `MP4 · H.264` option appears in the format dropdown automatically when the browser's `MediaRecorder` supports it; download filename extension follows the container.
- **Screenshot mode** — grab a full-resolution PNG still of the shared screen while recording.
- **Custom hotkey remapping** — click a key chip in the Shortcuts panel and press any key; conflicts are rejected.
- **Preference persistence** — all toggles, quality/format presets, countdown choice, and hotkeys are saved to `localStorage` and restored on load.

### Changed
- Download button label now reflects the actual container (`Download WEBM` / `Download MP4`).
- Recorder core rewritten to compose the working stream from an explicit video track + mixed audio tracks (cleaner webcam/PiP integration).

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
