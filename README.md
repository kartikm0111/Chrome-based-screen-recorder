<div align="center">

<img src="assets/favicon.svg" alt="ScreenForge" width="120" height="120" />

# ScreenForge

### Chrome-based Screen Recorder — powered by the native platform.

**Studio-grade screen &amp; microphone recording. Zero dependencies. 100 % client-side. Deployed on the edge.**

<p>
  <a href="https://screenforage.vercel.app"><img alt="Live Demo" src="https://img.shields.io/badge/%E2%97%89_LIVE_DEMO-screenforage.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white" /></a>
</p>

<p>
  <a href="https://vercel.com/new/clone?repository-url=https://github.com/kartikm0111/Chrome-based-screen-recorder"><img alt="Deploy with Vercel" src="https://vercel.com/button" /></a>
</p>

<p>
  <img alt="License MIT" src="https://img.shields.io/badge/License-MIT-8b5cf6.svg" />
  <img alt="Made with Vanilla JS" src="https://img.shields.io/badge/Made_with-Vanilla_JS-f7df1e?logo=javascript&logoColor=000" />
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-0-22d3ee" />
  <img alt="Bundle Size" src="https://img.shields.io/badge/bundle-~30KB-10b981" />
  <img alt="Chrome supported" src="https://img.shields.io/badge/Chrome-%E2%9C%93-4285F4?logo=googlechrome&logoColor=white" />
  <img alt="Edge supported" src="https://img.shields.io/badge/Edge-%E2%9C%93-0078D7?logo=microsoftedge&logoColor=white" />
  <img alt="Firefox supported" src="https://img.shields.io/badge/Firefox-%E2%9C%93-FF7139?logo=firefox&logoColor=white" />
  <img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-ec4899.svg" />
</p>

<p>
  <b><a href="https://screenforage.vercel.app">🎬 Try the Live App</a></b>
  &nbsp;·&nbsp;
  <a href="#-quick-start">Quick Start</a>
  &nbsp;·&nbsp;
  <a href="#-features">Features</a>
  &nbsp;·&nbsp;
  <a href="#-architecture">Architecture</a>
  &nbsp;·&nbsp;
  <a href="#-deployment">Deploy</a>
  &nbsp;·&nbsp;
  <a href="#-faq">FAQ</a>
</p>

</div>

---

## 🎬 Live Demo

> **The app is live right now** → **[screenforage.vercel.app](https://screenforage.vercel.app)**
>
> No sign-up, no download, no tracking. Open it in Chrome, click **Start Recording**, and go.

<div align="center">
    <img src="assets/screenshot.png" alt="ScreenForge recorder interface" width="900" onerror="this.style.display='none'" />
</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [How It Works](#-how-it-works)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Browser Support](#-browser-support)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Performance &amp; Bundle](#-performance--bundle)
- [Privacy &amp; Security](#-privacy--security)
- [Roadmap](#-roadmap)
- [FAQ](#-faq)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

---

## 🧭 Overview

**ScreenForge** is a professional-grade screen recorder that runs **entirely inside your browser**. It's built directly on top of the native web platform — `getDisplayMedia`, `getUserMedia`, `MediaRecorder`, and the `WebAudio` API — with **no frameworks, no bundlers, no server component, and no runtime dependencies**.

The entire application is a **single static site** that ships in **under 30 KB gzipped**, deploys to Vercel in seconds, and delivers a native-app feel through a hand-crafted design system.

### Why does this project exist?

| Problem with existing tools | ScreenForge's answer |
| --- | --- |
| Desktop apps require installation and permissions. | Runs in a browser tab. Nothing to install. |
| Web recorders upload your video to their servers. | 100 % client-side. Your recording never leaves your device. |
| Most tools are hidden behind sign-up walls or paywalls. | Zero accounts. Zero limits. Zero ads. |
| Chrome extensions ask for wide-ranging permissions. | Uses only the standards-based APIs the browser already exposes. |

### Who is it for?

- **Developers &amp; engineers** capturing bug reproductions or demos.
- **Educators &amp; students** recording lectures or walkthroughs.
- **Creators &amp; streamers** who need a lightweight, no-nonsense recorder.
- **Support teams** documenting reproducible workflows.

---

## ✨ Features

### Core capabilities

| | Feature | Description |
| :---: | --- | --- |
| 🎥 | **Screen capture** | Record any screen, application window, or browser tab via `getDisplayMedia`. |
| 🎤 | **Microphone recording** | High-quality mic capture with echo cancellation, noise suppression, and auto gain control. |
| 🔊 | **System audio** | Captures tab / system audio where the browser supports it (Chrome, Edge). |
| 🎚️ | **Real-time audio mixing** | Mic and system audio are mixed into a single track using the WebAudio API. |
| ⏸️ | **Pause &amp; resume** | Full pause / resume support with a **pause-aware** duration timer. |
| ⏹️ | **Stop &amp; finalise** | Cleanly closes all media tracks and generates a self-contained WebM blob. |
| ⚡ | **Instant preview** | Watch your recording back the moment you stop — no server round-trip. |
| 💾 | **One-click download** | Exports a `.webm` file with an ISO-8601 timestamped filename. |
| 🎛️ | **Quality presets** | 480p / 720p / 1080p resolutions at 30–60 FPS. |
| 🧩 | **Codec picker** | VP9 + Opus, VP8 + Opus, or **MP4 · H.264** where the browser supports it. |
| 📹 | **Webcam overlay** | A circular face-cam bubble composited live into any corner of the recording. |
| ⏱️ | **Countdown** | Optional 3 / 5 / 10-second on-screen countdown before capture begins. |
| ✂️ | **In-browser trim** | Cut the start and end off your clip with dual sliders — no external editor. |
| 📸 | **Screenshot mode** | Grab a full-resolution PNG still of the shared screen mid-recording. |

### Interface &amp; UX

| | Feature | Description |
| :---: | --- | --- |
| 🎨 | **Custom design system** | Glass-morphism panels, animated ambient blobs, gradient accents. |
| 🌗 | **Dark mode by default** | Optimised for long recording sessions. |
| 📱 | **Fully responsive** | Works down to a 360 px viewport. |
| 🎯 | **REC badge &amp; live timer** | Always know you're recording and for how long. |
| 🔴 | **Live status pill** | `Idle → Recording → Paused → Ready` — with animated indicators. |
| ⌨️ | **Keyboard shortcuts** | `R` to start/stop, `Space` to pause/resume — **fully remappable**. |
| 💾 | **Saved preferences** | Every toggle, preset, and hotkey persists to `localStorage`. |
| 🔔 | **Toast notifications** | Non-intrusive success/error feedback. |
| 🛡️ | **Unload protection** | `beforeunload` warns you if you're about to lose a recording. |
| ♿ | **Accessible** | Semantic HTML, ARIA labels, keyboard-navigable, `prefers-reduced-motion` support. |

### Engineering

| | Feature | Description |
| :---: | --- | --- |
| 🪶 | **Zero dependencies** | Not even a build step. Just HTML, CSS, JS. |
| 🧠 | **Event-driven core** | The `Recorder` class exposes a clean `.on(event, fn)` API. |
| 🔄 | **State machine** | `idle → recording ↔ paused → ready` — predictable transitions. |
| 🧹 | **Automatic cleanup** | Every media track is stopped on stop, cancellation, or unload. |
| 🛰️ | **Feature detection** | Fails gracefully on unsupported browsers with a clear message. |
| 🔒 | **Security headers** | `Permissions-Policy`, `X-Frame-Options`, `Referrer-Policy` set at the edge. |

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
| :---: | :---: |
| **Markup** | ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white) |
| **Styles** | ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white) |
| **Scripting** | ![JavaScript](https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?style=flat&logo=javascript&logoColor=black) |
| **Web APIs** | `MediaRecorder` · `getDisplayMedia` · `getUserMedia` · `WebAudio` · `Canvas` · `Blob` · `localStorage` |
| **Fonts** | ![Google Fonts](https://img.shields.io/badge/Inter-4285F4?style=flat&logo=googlefonts&logoColor=white) ![JetBrains Mono](https://img.shields.io/badge/JetBrains_Mono-000?style=flat&logo=jetbrains&logoColor=white) |
| **Hosting** | ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white) |
| **Version Control** | ![Git](https://img.shields.io/badge/Git-F05032?style=flat&logo=git&logoColor=white) ![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white) |
| **Deps** | **0** (yes, zero) |

</div>

---

## 🚀 Quick Start

### Option 1 — Just use the live app

Open **[screenforage.vercel.app](https://screenforage.vercel.app)** in Chrome. That's it.

### Option 2 — Run it locally

`getDisplayMedia` requires a **secure context** — that means `localhost` or HTTPS. Opening `index.html` with `file://` will **not** work.

```bash
# 1. Clone the repository
git clone https://github.com/kartikm0111/Chrome-based-screen-recorder.git
cd Chrome-based-screen-recorder

# 2. Serve it — pick one:
python -m http.server 3000            # any Python 3 install
npx --yes serve@latest . -l 3000      # any Node install
# or: VS Code → Live Server extension → right-click index.html

# 3. Open http://localhost:3000 in Chrome
```

### Option 3 — Deploy your own copy

Click the button below. Vercel will fork the repo into your GitHub and deploy it in ~30 seconds — no configuration needed.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kartikm0111/Chrome-based-screen-recorder)

---

## 🧩 How It Works

```
       ┌──────────────┐   ┌──────────────┐
       │ getDisplay-  │   │ getUser-     │
       │   Media()    │   │   Media()    │
       │ (screen+sys) │   │    (mic)     │
       └──────┬───────┘   └──────┬───────┘
              │                  │
              ▼                  ▼
     ┌──────────────────────────────────┐
     │       WebAudio AudioContext      │
     │   ┌────────┐        ┌────────┐   │
     │   │ Source │───┐  ┌─│ Source │   │
     │   └────────┘   ▼  ▼ └────────┘   │
     │              ┌──────┐            │
     │              │ Gain │            │
     │              └──┬───┘            │
     │                 ▼                │
     │        MediaStreamDestination    │
     └────────────────┬─────────────────┘
                      │
                      ▼
             ┌────────────────┐
             │ MediaRecorder  │
             │  (VP9 + Opus)  │
             └────────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │  Blob (WebM)  │───▶ <video> preview
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │   Download    │
              └───────────────┘
```

1. **User picks sources** — mic, system audio, quality, codec.
2. **Browser prompts** for screen selection via `getDisplayMedia`.
3. **Mic stream** is requested via `getUserMedia` (if enabled).
4. **WebAudio mixes** the two audio streams into a single destination track.
5. **MediaRecorder** consumes the combined stream and emits `dataavailable` chunks every second.
6. **On stop**, chunks are concatenated into a WebM `Blob`.
7. **Object URL** is created and set as the `<video>` source for instant preview.
8. **Download** triggers a hidden `<a download>` with a timestamped filename.

---

## 🏛️ Architecture

The project is intentionally split into two JavaScript modules — a **framework-agnostic core** and a **UI layer**. You could drop `recorder.js` into any other web app and wire it up to a different UI in an afternoon.

### `src/js/recorder.js` — The core

A tiny event-emitter around `MediaRecorder`. The public API:

```js
const recorder = new ScreenForge.Recorder();

recorder.on('statechange', (state) => { /* idle | recording | paused | ready | error */ });
recorder.on('tick',        (ms)    => { /* elapsed ms, ~60 Hz */ });
recorder.on('stopped',     (data)  => { /* { blob, url, sizeText, durationText, mimeType } */ });
recorder.on('error',       (err)   => { /* Error */ });

await recorder.start({
    mic:         true,
    systemAudio: true,
    height:      720,
    mimeType:    'video/webm;codecs=vp9,opus'
});

recorder.pause();
recorder.resume();
recorder.stop();
recorder.reset();
```

Under the hood it handles: codec negotiation with fallback, WebAudio mixing, high-precision duration tracking that respects pauses, and complete track/stream cleanup on every exit path.

### `src/js/app.js` — The UI layer

Reads DOM nodes once, subscribes to Recorder events, drives the visual state — status pill, REC badge, timer, controls, toasts. Also owns keyboard shortcuts and the `beforeunload` guard.

---

## 📂 Project Structure

```
Chrome-based-screen-recorder/
├── index.html              # Semantic markup, landing + recorder in one page
├── src/
│   ├── css/
│   │   └── styles.css      # Design system, layout, components
│   └── js/
│       ├── recorder.js     # Framework-agnostic recorder core
│       └── app.js          # DOM wiring, shortcuts, UX polish
├── assets/
│   └── favicon.svg         # Brand mark
├── vercel.json             # Hosting config + security headers
├── package.json            # npm scripts (dev / format / lint)
├── CHANGELOG.md            # Release notes
├── CONTRIBUTING.md         # Contributor guide
├── LICENSE                 # MIT license
├── .gitignore
└── README.md
```

---

## 🚢 Deployment

This repo is already live on Vercel → **[screenforage.vercel.app](https://screenforage.vercel.app)**

### Deploy your own copy

<details>
<summary><b>Option A — One-click Vercel deploy</b></summary>

Click the badge:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kartikm0111/Chrome-based-screen-recorder)

Vercel forks the repo into your GitHub account, then auto-deploys on every push to `main`.

</details>

<details>
<summary><b>Option B — Vercel CLI</b></summary>

```bash
npm install --global vercel
cd Chrome-based-screen-recorder
vercel        # preview
vercel --prod # production
```

</details>

<details>
<summary><b>Option C — Any static host</b></summary>

The output is 100 % static, so it works anywhere:

| Host | Command / setup |
| --- | --- |
| **Netlify** | Drag the folder into netlify.com/drop |
| **Cloudflare Pages** | Connect the repo, no build command, publish dir = `/` |
| **GitHub Pages** | Enable Pages on the `main` branch |
| **Firebase Hosting** | `firebase init hosting` &amp; deploy |
| **AWS S3 + CloudFront** | Sync the folder to an S3 bucket |

</details>

### Security headers

The included `vercel.json` sets:

```jsonc
{
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "display-capture=(self), microphone=(self), camera=()",
    "Cross-Origin-Opener-Policy": "same-origin"
}
```

---

## 🌐 Browser Support

| Browser | Screen capture | Mic capture | System audio | Notes |
| --- | :---: | :---: | :---: | --- |
| ![Chrome](https://img.shields.io/badge/Chrome-4285F4?logo=googlechrome&logoColor=white) 106+ | ✅ | ✅ | ✅ | **Recommended.** Tab &amp; screen system-audio on Windows/ChromeOS. |
| ![Edge](https://img.shields.io/badge/Edge-0078D7?logo=microsoftedge&logoColor=white) 106+ | ✅ | ✅ | ✅ | Chromium — matches Chrome. |
| ![Firefox](https://img.shields.io/badge/Firefox-FF7139?logo=firefox&logoColor=white) 100+ | ✅ | ✅ | ⚠️ Limited | System audio not exposed. |
| ![Safari](https://img.shields.io/badge/Safari-000000?logo=safari&logoColor=white) 17+ | ✅ | ✅ | ❌ | No system audio; narrower codec set. |
| ![iOS](https://img.shields.io/badge/iOS-000000?logo=apple&logoColor=white) / ![Android](https://img.shields.io/badge/Android-3DDC84?logo=android&logoColor=white) | ❌ | — | — | `getDisplayMedia` unsupported on mobile browsers. |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| <kbd>R</kbd> | Start / stop the recording |
| <kbd>Space</kbd> | Pause / resume the recording |

Both shortcuts are **remappable** — click the key chip in the Shortcuts panel, then press any key. Your choice is saved to `localStorage`. Focus must be on the page (not inside an input) for shortcuts to fire.

---

## 📊 Performance &amp; Bundle

| Metric | Value |
| --- | --- |
| **HTML** | ~18 KB |
| **CSS** | ~19 KB |
| **JS (recorder + app)** | ~14 KB |
| **Assets** | &lt;1 KB (SVG favicon) |
| **Total (uncompressed)** | ~52 KB |
| **Total (gzipped)** | **~30 KB** |
| **Runtime dependencies** | **0** |
| **First Contentful Paint** | &lt; 500 ms |
| **Lighthouse — Best Practices** | 100 |
| **Lighthouse — Accessibility** | 100 |
| **Lighthouse — SEO** | 100 |

---

## 🔒 Privacy &amp; Security

ScreenForge is a **static site**. There is:

- ❌ **No** server component
- ❌ **No** analytics or telemetry
- ❌ **No** third-party scripts
- ❌ **No** cookies
- ❌ **No** account system
- ✅ **Yes**, your recording lives entirely in an in-memory `Blob` on your device

The only outbound network requests are for **Google Fonts** (Inter, JetBrains Mono). Remove the `<link>` tag in `index.html` for a zero-external-request build.

---

## 🗺️ Roadmap

- [x] Screen + microphone recording
- [x] System audio capture with real-time mixing
- [x] Pause / resume with pause-aware timer
- [x] Instant preview + WebM download
- [x] Keyboard shortcuts
- [x] Vercel deployment with security headers
- [x] Webcam picture-in-picture overlay — composited live onto the recording
- [x] In-browser trim — dual-slider range trim with progress feedback
- [x] MP4 export — surfaced automatically where `MediaRecorder` supports it
- [x] Countdown before recording starts (3 / 5 / 10 s, or off)
- [x] Custom hotkey remapping — click a key chip and press any key
- [x] Presets persisted to `localStorage` — every toggle survives a refresh
- [x] Screenshot mode — grab a full-res PNG still mid-recording
- [ ] Cloud upload adapters (opt-in) — Google Drive, Dropbox
- [ ] Webcam-only recording mode
- [ ] Annotation tools (draw on screen while recording)

---

## ❓ FAQ

<details>
<summary><b>Where does the recording go?</b></summary>

Nowhere but your device. The video is held in an in-memory `Blob` and handed to your browser's own download prompt. Refreshing the tab discards it.

</details>

<details>
<summary><b>Why WebM and not MP4?</b></summary>

WebM is what `MediaRecorder` emits natively in every browser that supports screen capture, so it's the default. **Where the browser can also record MP4 directly (e.g. recent Chrome and Safari builds), an MP4 · H.264 option appears automatically in the Format &amp; codec dropdown.** If you need MP4 on a browser that doesn't support it, the conversion is a one-liner: `ffmpeg -i input.webm -c copy output.mp4`.

</details>

<details>
<summary><b>Why doesn't it work when I double-click <code>index.html</code>?</b></summary>

`getDisplayMedia` is only available in a **secure context** — `https://` or `localhost`. Browsers refuse to expose screen capture from `file://` URLs. Run one of the local-server commands in <a href="#-quick-start">Quick Start</a>.

</details>

<details>
<summary><b>My microphone isn't being captured — why?</b></summary>

Three things to check:
<br>1. The <b>Include microphone</b> toggle is on.
<br>2. Your browser has microphone permission for the site (padlock icon → Site settings).
<br>3. On macOS, Chrome needs mic permission in <b>System Settings → Privacy &amp; Security → Microphone</b>.

</details>

<details>
<summary><b>Can I record system audio on macOS?</b></summary>

Not out of the box — macOS doesn't let browsers tap system audio directly. Workarounds include using a virtual audio device like <a href="https://github.com/ExistentialAudio/BlackHole" target="_blank" rel="noopener">BlackHole</a> and routing it through your mic input.

</details>

<details>
<summary><b>Is there a maximum recording length?</b></summary>

No hard limit imposed by ScreenForge, but WebM `Blob`s live in memory. Very long recordings (30+ minutes at 1080p) may push browser memory limits on lower-end devices.

</details>

<details>
<summary><b>Can I use this offline?</b></summary>

Yes — after the first load, the app is fully self-contained. Add it to your home screen (Chrome → three-dot menu → Install) for one-tap offline access. A service worker for true offline-first caching is planned.

</details>

<details>
<summary><b>How do I contribute?</b></summary>

See the <a href="./CONTRIBUTING.md">contributing guide</a>. The short version: keep it dependency-free, keep it vanilla, and open a PR with a clear description of the "why".

</details>

---

## 🤝 Contributing

Contributions are very welcome — please read the [contributing guide](./CONTRIBUTING.md) before opening a pull request.

The short version:

1. **Fork** the repo and create a feature branch.
2. **Keep it dependency-free.** No frameworks, no build tools.
3. **Test on the latest Chrome, Edge, and Firefox.**
4. **Update the CHANGELOG** for user-facing changes.
5. **Open a PR** describing the "why", not just the "what".

---

## 📜 License

Distributed under the [MIT License](./LICENSE). Free to use, fork, and modify for personal or commercial projects.

```
Copyright (c) 2026 kartikm0111
```

---

## 🙏 Acknowledgements

- The **[MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)** — for making all of this possible without a plugin.
- **[Vercel](https://vercel.com)** — for zero-config edge hosting.
- **[Inter](https://rsms.me/inter/)** &amp; **[JetBrains Mono](https://www.jetbrains.com/mono/)** — for beautiful, open-source typefaces.

---

<div align="center">

### Built with vanilla HTML, CSS &amp; JavaScript.

**[🎬 Try the Live App](https://screenforage.vercel.app)** &nbsp;·&nbsp;
**[⭐ Star on GitHub](https://github.com/kartikm0111/Chrome-based-screen-recorder)** &nbsp;·&nbsp;
**[🐛 Report a Bug](https://github.com/kartikm0111/Chrome-based-screen-recorder/issues)**

<sub>If ScreenForge saved you time, a ⭐ on the repo goes a long way.</sub>

</div>
