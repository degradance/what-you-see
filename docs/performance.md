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

## Changes against the baseline

Same method, same machine, five loads per profile.

### 1 · Exhibit A rewrites its rows in place

The feed now renders a fixed set of eight rows keyed by position. A new edit changes the text of the rows; no row element
moves, so nothing is counted as a shift. The empty rows also reserve the feed's height before the first event.

| Metric | Baseline mobile | After | Baseline desktop | After |
|---|---|---|---|---|
| Cumulative Layout Shift | 0.635 | **0.227** | 0.227 | **0.167** |
| CLS, worst window in steady state | 0.478 | **0.001** | 0.153 | **0** |
| Layout, steady state | 9.8 ms/s | 11.5 ms/s | 4.2 ms/s | 4.5 ms/s |

Layout time did not drop: the rows still reflow when their text changes. The fix is for visual stability, not for CPU.
What is left of CLS happens in the first ~150 ms, when the cards swap their loading line for the real layout.

### 2 · The fallback font takes the web font's shape

On a phone the title and the tagline were set in Georgia until Instrument Serif arrived. Georgia is about a quarter
wider, so both wrapped onto a second line and the header lost 85 px at the swap, moving the whole board. Local Georgia
and Times New Roman are now declared as fallback faces with `size-adjust` and ascent/descent overrides measured against
Instrument Serif: line heights match exactly and widths within 2–5 %, and the header keeps its height through the swap.

| Metric | Before (after change 1) | After |
|---|---|---|
| CLS, mobile | 0.227 | **0.001** |
| CLS, desktop | 0.167 | 0.167 |

The mobile number flatters the board. Under Slow 4G the widget chunks arrive before the first paint, so the
"Decrypting signal…" line is never drawn. Without throttling, on the same phone viewport, the line is painted and its
swap for the widget still scores 0.44; on desktop it is the whole remaining 0.167. Phones without Georgia or
Times New Roman (Android) fall back to an unadjusted serif and keep the old shift.

### 3 · Redacted skeletons

Every widget has a small `Skeleton.vue` that repeats its layout with the data blacked out: placeholder words of the
usual length in transparent text over a 14 % `ink` bar, so each line box is the height of the real one. The skeleton
ships in the eager chunk and is the async component's loading state; the widget keeps the same bars until its first
data. The globes keep their canvas from the first frame, so B and C black out only their numbers in place.

A declarative block list in `widget.ts` was the first idea; it cannot describe B and C, which switch to two columns on
the width of their card, so each skeleton is a template with the same classes as its widget. A throwaway check loads
the board three ways (widget chunks blocked, feeds blocked, live) at 375, 412, 700, 1024 and 1350 px and compares card
heights: A–D match to the pixel at every width. E's height depends on how many headlines wrap, so on narrow cards it
can differ by a line or two; from `lg` its row sets the height.

| Metric | Before (after change 2) | After |
|---|---|---|
| CLS, mobile (Slow 4G, 4× CPU) | 0.001 | 0.001 |
| CLS, phone viewport without throttling | 0.44 | **0.001** |
| CLS, desktop | 0.167 | **0** |
| Shell JS (gzip) | 31.3 KB | 33.2 KB |
| First Contentful Paint, mobile | 608 ms | 640 ms |

The five skeletons cost 1.9 KB in the eager chunk and about 30 ms of first paint on the throttled phone; the shell stays
under its 50 KB budget.

## Load generator

Exhibit A reads its messages from a `Source` (`core/streams/source.ts`): the live Server-Sent Events stream, or a
recording played back at a multiple of real time. Both hand raw message strings to the same pipeline (`JSON.parse`,
the valibot schema, the ring buffer and rate counters), and `deliver()` times that pipeline for every message. The
panel's "Turn up the chatter" control switches between them; the card says "Replay" instead of "Live" while it plays.

The recording (`scripts/record-wikimedia.mjs`, 60 s, 2,841 messages, 47 per second) keeps every message the stream
sent, including the ~70 % the widget rejects (logs, categorisation), because rejecting them costs a parse too. Each
message is rebuilt at its original size, a median of 1.2 KB, with filler standing in for the fields left out, so
`JSON.parse` does the same work. Titles of user and user-talk pages are not stored: they are editor names. The file is a
lazy chunk of 33 KB gzip that only a visitor who turns the load up downloads.

### Pipeline cost by rate · 2026-09-24

Phone viewport, CPU slowed 4×, 10 s per rate after 3 s to settle. "Pipeline" is what `deliver()` measured; the other
columns are DevTools counters for the whole page.

| Rate | Messages | Pipeline | Script | Layout | Main thread busy | Long frames |
|---|---|---|---|---|---|---|
| Live | 23–29 /s | 0.1–0.2 ms/s | 2.2 ms/s | 10.5 ms/s | 58–69 ms/s | 0 |
| ×1 | 64 /s | 0.1–0.3 ms/s | 1.5 ms/s | 11.0 ms/s | 53–59 ms/s | 0 |
| ×10 | 397 /s | 0.9 ms/s | 2.4 ms/s | 8.2 ms/s | 41–45 ms/s | 0 |
| ×100 | 4,738 /s | 9–11 ms/s | 11–14 ms/s | 5.6 ms/s | 38–43 ms/s | 0 |

At ×100 the pipeline costs about 2 µs a message and about 1 % of a slowed CPU; the panel's own figure and the DevTools
script counter agree. The cost that does not grow with the rate is rendering: the widget touches reactive state on a
250 ms flush, so the DOM changes four times a second at any rate. The live stream costs more layout than the replay at
the same rate because real headlines vary more in length than the rows they replace.

`performance.now()` is coarsened to about 0.1 ms in a page that is not cross-origin isolated, so single messages mostly
read as 0 or 0.1 ms. Summed over thousands of messages the error averages out, which the match with the DevTools counter
confirms.

### Found on the way

The panel moved when a late chunk loaded: its value column was sized by content, so "76 KB" becoming "109 KB" widened
it, rewrapped a label and moved the panel's top edge (0.19 CLS on a phone, where the panel is anchored to the bottom).
The column now has a fixed width.

### The ceiling: ×1000

| CPU | Messages | Pipeline | Script | Main thread busy | Frame rate | Long frames |
|---|---|---|---|---|---|---|
| no slowdown | 47,350 /s | 112 ms/s (2.4 µs each) | 146 ms/s | 182 ms/s | 60 fps | 0 |
| 4× slower | 47,304 /s | 170 ms/s (3.6 µs each) | 193 ms/s | 223 ms/s | 60 fps | 0 |

At 47 thousand messages a second the stream takes 15–20 % of the main thread and the board still renders every frame:
the replay delivers its work in 20 ms slices of about 2 ms each, and nothing reaches a long task. This is the "before"
for moving the pipeline into a Web Worker: the metric that can move is main-thread busy time, not the frame rate.

**The CPU slowdown does not scale microsecond work.** DevTools throttles by pausing the renderer in time slices, so a
span of a few microseconds is rarely paused. A synthetic `JSON.parse` loop of the same 1.2 KB message measured 1.17 µs
per call unthrottled and 1.58 µs at "4× slower", not 4.7 µs. Per-message costs in this document are therefore quoted
without throttling; the throttled profile is only used for totals over seconds.
