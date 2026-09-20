# What you see?

> Everything is live. Nothing is a coincidence.

A live dashboard of public data feeds, framed as a conspiracy evidence board.
**All data is public and real. All connections are made up.**

Dark ("Redacted") by default, light ("Declassified") behind the switch.

## Status

Live now: **Exhibit A**, a real-time feed of Wikipedia edits.
Next: an earthquake globe, the ISS, space weather and Hacker News, then a performance HUD backed by measurements.

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
  an SSE client that reconnects and pauses while the tab is hidden.
- **Every exhibit is a lazy chunk.** A widget is small eager metadata plus `load: () => import('./Widget.vue')`, so the
  shell stays light and each feed only costs bytes when it is on the board.
- **Hot paths avoid reactivity.** Stream events go into plain buffers; the DOM updates four times a second, whatever the
  event rate.
- **Data is validated at the edge** with valibot; malformed events are dropped, never thrown.

## Data sources

All keyless, HTTPS, CORS-enabled. Nothing is stored, and there is no backend.

- Wikimedia recent changes (`stream.wikimedia.org`)
- USGS earthquakes, wheretheiss.at, NOAA SWPC and Hacker News are next

Editor names are deliberately never read or shown: anonymous Wikipedia edits are attributed to IP addresses.
