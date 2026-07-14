# Contributing to ScreenForge

Thanks for wanting to help improve **ScreenForge**! This document explains the
short list of things we care about when reviewing pull requests.

## Ground rules

- **Keep it dependency-free.** The whole point of the project is that it runs in
  a single browser tab with zero framework overhead. Please don't introduce
  build tools, bundlers, or runtime dependencies without opening a discussion first.
- **Vanilla stack only.** HTML, CSS, and JavaScript. No TypeScript, no React,
  no Sass. Modern browser APIs are fine; polyfills should be avoided.
- **Progressive enhancement.** Feature-detect (`if ('MediaRecorder' in window)`)
  rather than assuming support.

## Development

```bash
git clone https://github.com/kartikm0111/Chrome-based-screen-recorder.git
cd Chrome-based-screen-recorder
npm run dev     # serves the site at http://localhost:3000
```

`getDisplayMedia` requires a **secure context** — that means `localhost` or
HTTPS. Opening `index.html` directly with the `file://` protocol will not work.

## Pull requests

1. Fork the repo and create a feature branch: `git checkout -b feat/my-feature`.
2. Keep commits focused and descriptive (`fix(recorder): stop tracks on error`).
3. Update the `README.md` or `CHANGELOG.md` if user-facing behavior changes.
4. Test on the latest **Chrome**, **Edge**, and **Firefox**.
5. Open a PR describing the "why", not just the "what".

## Reporting bugs

Please include:

- Browser + version (`chrome://version`)
- Operating system
- Reproduction steps
- Console output (screenshot or paste)

## Code of conduct

Be kind, be curious, and assume good intent.
