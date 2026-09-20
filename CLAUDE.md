# What You See?

A live dashboard of public data feeds framed as a conspiracy board. Real data, made-up "connections".
Built to demonstrate measurable performance and a clean, modular architecture.

## Commands

```bash
npm run dev         # dev server
npm run typecheck   # vue-tsc
npm test            # vitest (pure logic in core/ and widgets/*/schema.ts)
npm run build       # typecheck + production build
```

## Layout

```
src/core/      framework-agnostic TS: streams, ring buffer, rate counter, backoff. No Vue imports.
src/shell/     the board: layout, cards, theme switch, HUD.
src/widgets/   one folder per exhibit: widget.ts (metadata, eager) · Widget.vue (lazy chunk) · schema.ts (valibot) · tests.
```

## Conventions

- Widgets import from `@/core` only, never from each other or from `@/shell`. Cross-widget needs go through `core`.
- Register a widget in `src/widgets/index.ts`; load its component with `load: () => import(...)`.
- Validate every external payload with valibot at the edge. Drop bad events; never throw from a stream handler.
- Hot paths (stream events) use plain objects, `RingBuffer` and `RateCounter`; reactive state is touched on a throttled flush.
- Add a runtime dependency only with a reason and a known gzip cost.
- Colours come only from the CSS tokens in `src/styles/main.css` (`text-ink`, `bg-surface`, `text-signal`, …). Check both themes.
- Anything that moves respects `prefers-reduced-motion`. No rotated text containers; only stamps and pins may tilt.
- Never display or store Wikipedia editor names: anonymous edits are attributed to IP addresses.
- Tone is satire. Keep the footer disclaimer and make no real-world conspiracy claims.
- Comments explain why, never what. No task markers or open questions left in code.
- Code, docs and commit messages are written in English.
