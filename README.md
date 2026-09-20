# What you see?

> Everything is live. Nothing is a coincidence.

**[Live demo](https://degradance.github.io/what-you-see/)** ·
[![CI](https://github.com/degradance/what-you-see/actions/workflows/ci.yml/badge.svg)](https://github.com/degradance/what-you-see/actions/workflows/ci.yml)

A live dashboard of public data feeds, framed as a conspiracy evidence board.
**All data is public and real. All connections are made up.**

Dark ("Redacted") by default, light ("Declassified") behind the switch.

## Status

Live now: **Exhibit A**, a real-time feed of Wikipedia edits, **Exhibit B**, a globe of the past day's earthquakes, **Exhibit C**, the ISS with its trail and field of view, **Exhibit D**, a week of the planetary K-index, and **Exhibit E**, the Hacker News front page.
Next: a performance HUD backed by measurements.

## Run it

Requires Node 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run typecheck` | `vue-tsc` |
| `npm test` | Vitest |
| `npm run build` | Typecheck and production build into `dist/` |

## How it is built

- **Vue 3 + TypeScript + Vite + Tailwind v4.** Design tokens are CSS variables, so both themes share one set of components.
- **`src/core/`** is framework-agnostic: a ring buffer, a sliding-window rate counter, exponential backoff with jitter, and
  an SSE client and a polling helper that both reconnect with backoff and pause while the tab is hidden, and a canvas
  globe (`d3-geo`) that can follow a point, stops drawing when it is off screen and honours `prefers-reduced-motion`.
  Exhibits B and C share one globe chunk, so the second one costs about 2 KB.
- **Every exhibit is a lazy chunk.** A widget is small eager metadata plus `load: () => import('./Widget.vue')`, so the
  shell stays light and each feed only costs bytes when it is on the board.
- **A bento board.** Cards declare their size in grid cells, and each card body is a CSS size container: a widget lays
  itself out by the width of its card (`@xl:` container variants), not by the viewport.
- **Hot paths avoid reactivity.** Stream events go into plain buffers; the DOM updates four times a second, whatever the
  event rate.
- **Data is validated at the edge** with valibot; malformed events are dropped, never thrown.

## Data sources

All keyless, HTTPS, CORS-enabled. Nothing is stored, and there is no backend.

- Wikimedia recent changes (`stream.wikimedia.org`)
- USGS earthquakes (`earthquake.usgs.gov`)
- wheretheiss.at (ISS position and history)
- NOAA SWPC (planetary K-index)
- Hacker News (`hacker-news.firebaseio.com`)

Editor names are deliberately never read or shown: anonymous Wikipedia edits are attributed to IP addresses. Hacker News authors are left out the same way.

## License

The code is released under the [MIT License](LICENSE). Fonts (Instrument Serif, JetBrains Mono) are distributed through
[Fontsource](https://fontsource.org) under the SIL Open Font License 1.1. Coastlines come from [Natural Earth](https://www.naturalearthdata.com) (public domain) via the `world-atlas` package;
`node scripts/build-land.mjs` regenerates the compact copy in `src/core/globe/land.json`. Data belongs to its respective providers.
