# Performance

Numbers for the live board, measured before any optimisation. Every later change gets a before/after row against this
baseline, measured the same way.

## Baseline · 2026-09-24 · commit `c360e25`

### Method

- Production build served by `vite preview`, cold load (cache disabled), headless Chromium 153 driven over the DevTools
  protocol. Five loads per profile; the table shows the median.
- **Mobile:** 412 × 823 viewport at 1.75× DPR, network throttled to Lighthouse's "Slow 4G" values (150 ms RTT,
  1.6 Mbit/s down, 750 kbit/s up) and the CPU slowed 4×. Throttling is applied at the protocol level, not simulated as
  Lighthouse does, so these numbers are close to Lighthouse's but not identical.
- **Desktop:** 1350 × 940 viewport, no throttling.
- **Load metrics** come from `PerformanceObserver` in the page: FCP, LCP, CLS with the same 1 s / 5 s session windows
  as `web-vitals`, and TBT summed over long tasks after FCP.
- **Steady state** starts 8 s after `load` and runs for 30 s with the throttling still on. Main-thread time is the
  delta of the DevTools `Performance.getMetrics` counters; stream events are the SSE messages the browser received.
- Absolute times depend on the machine. Compare only runs made on the same machine.

### Load

| Metric | Mobile | Desktop | Target |
|---|---|---|---|
| First Contentful Paint | 612 ms | 60 ms | |
| Largest Contentful Paint | 612 ms | 60 ms | < 2 s on mobile |
| LCP element | the `h1` | the `h1` | |
| Cumulative Layout Shift | **0.635** | **0.227** | < 0.1 |
| Total Blocking Time | 0 ms | 0 ms | |
| JS heap after load | 4.6 MB | 5.8 MB | |

Transferred on a cold load (both profiles): JS 76.2 KB, CSS 6.8 KB, fonts 87.5 KB, HTML 1.0 KB, feed data ≈ 24 KB.
Fonts outweigh all the JavaScript.

### Steady state (30 s)

| Metric | Mobile (4× CPU) | Desktop |
|---|---|---|
| Stream events received | 51 /s | 48 /s |
| Main-thread busy | 69 ms/s | 191 ms/s |
| of which script | 2.6 ms/s | 132 ms/s |
| of which layout | 9.8 ms/s | 4.2 ms/s |
| of which style | 5.9 ms/s | 3.0 ms/s |
| CLS, worst window in steady state | **0.478** | **0.153** |

The two profiles measure different things. The globes pause while they are off screen, and on the phone viewport only
Exhibit A is on screen, so the mobile column is close to the cost of the Wikipedia stream on its own. On the desktop
viewport both globes are visible and drawing takes about 4.4 ms per frame at 30 fps, which is most of the script time.

### Findings

1. **CLS is poor, and most of it never ends.** Exhibit A adds new rows at the top of its feed four times a second. Every
   existing row moves down, and Chromium counts each move as a layout shift. The steady-state windows alone score 0.48
   on mobile. This is the largest problem on the board.
2. **Cards grow when their widget mounts.** The first window adds the jump from the "Decrypting signal…" line to the
   real layout. The Redacted skeletons (Phase 4) target this part.
3. **The stream itself is cheap.** About 50 events per second cost under 20 ms of script, style and layout per second
   on a 4× slowed CPU; most of the remaining main-thread time is paint and compositing. The load generator will show
   how this grows with the event rate.
4. **Loading is fine.** LCP is the title, painted in the fallback font before the web fonts arrive, and there are no
   long tasks during load.
