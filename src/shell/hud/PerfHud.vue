<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { formatCls, formatKB, formatMs, formatUs } from '@/core/perf/format'
import { FrameMeter } from '@/core/perf/frames'
import { streamMeter } from '@/core/perf/stream'
import { summarizeResources, type ResourceLike, type ResourceTotals } from '@/core/perf/resources'
import { watchLongFrames, watchResources, watchVitals, type Rating, type Vital, type VitalName } from '@/core/perf/vitals'
import { REPLAY_RATES, onReplayRate, replayRate, setReplayRate, type ReplayRate } from '@/core/streams/load'

interface Snapshot {
  vitals: Partial<Record<VitalName, Vital>>
  fps?: number
  worstMs?: number
  stalls: number
  resources: ResourceTotals
  costMsPerS?: number
  stream?: { perS: number; msPerS: number; msPerEvent: number }
}

// Observers and frames write into plain objects; the template sees one snapshot per second.
const vitals: Snapshot['vitals'] = {}
const entries: ResourceLike[] = []
const meter = new FrameMeter()
let stalls = 0
let costMs = 0
let costSince = performance.now()
let frame = 0
let timer: ReturnType<typeof setInterval> | undefined
const stops: (() => void)[] = []

const snapshot = shallowRef<Snapshot>({ vitals: {}, stalls: 0, resources: summarizeResources([]) })
const open = ref(false)
const rate = ref<ReplayRate>(replayRate())
const root = ref<HTMLElement>()

// Its own work is timed too, so the panel can say what watching costs.
function timed<A extends unknown[]>(fn: (...args: A) => void) {
  return (...args: A) => {
    const start = performance.now()
    fn(...args)
    costMs += performance.now() - start
  }
}

const onFrame = timed((now: number) => meter.tick(now))
function loop(now: number) {
  onFrame(now)
  frame = requestAnimationFrame(loop)
}

const flush = timed(() => {
  const now = performance.now()
  const frames = meter.flush(now)
  snapshot.value = {
    vitals: { ...vitals },
    fps: frames?.fps ?? snapshot.value.fps,
    worstMs: frames?.worstMs ?? snapshot.value.worstMs,
    stalls,
    resources: summarizeResources(entries),
    costMsPerS: (costMs * 1000) / (now - costSince),
    stream: streamStats(streamMeter.take(), now - costSince),
  }
  costMs = 0
  costSince = now
})

function streamStats({ events, ms }: { events: number; ms: number }, windowMs: number): Snapshot['stream'] {
  if (events === 0) return undefined
  return { perS: (events * 1000) / windowMs, msPerS: (ms * 1000) / windowMs, msPerEvent: ms / events }
}

const RATE_LABEL: Record<ReplayRate, string> = { 0: 'Live', 1: '×1', 10: '×10', 100: '×100' }

function onVisibility() {
  if (document.hidden) {
    cancelAnimationFrame(frame)
    meter.reset()
  } else {
    frame = requestAnimationFrame(loop)
  }
}

function onPointerDown(event: PointerEvent) {
  if (open.value && !root.value?.contains(event.target as Node)) open.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => {
  watchVitals(timed((vital: Vital) => (vitals[vital.name] = vital)))
  stops.push(watchLongFrames(timed(() => stalls++)))
  stops.push(watchResources(timed((list: PerformanceResourceTiming[]) => entries.push(...list))))
  frame = requestAnimationFrame(loop)
  timer = setInterval(flush, 1000)
  document.addEventListener('visibilitychange', onVisibility)
  document.addEventListener('pointerdown', onPointerDown)
  stops.push(onReplayRate((next) => (rate.value = next)))
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  clearInterval(timer)
  stops.forEach((stop) => stop())
  document.removeEventListener('visibilitychange', onVisibility)
  document.removeEventListener('pointerdown', onPointerDown)
})

const TONE: Record<Rating, string> = { good: 'text-live', 'needs-improvement': 'text-warn', poor: 'text-signal' }
const vitalText = (name: VitalName) => {
  const vital = snapshot.value.vitals[name]
  if (!vital) return undefined
  return name === 'CLS' ? formatCls(vital.value) : formatMs(vital.value)
}
// A page that loads out of sight never gets an LCP (Chromium records the switch as a `visibility-state` entry).
const lcpMissing = () =>
  performance.getEntriesByType('visibility-state').some((entry) => entry.name === 'hidden') ? 'tab was hidden' : 'measuring'
const vitalTone = (name: VitalName) => {
  const vital = snapshot.value.vitals[name]
  return vital ? TONE[vital.rating] : 'text-muted'
}
</script>

<template>
  <div ref="root" class="relative shrink-0" @keydown="onKeydown">
    <button
      type="button"
      :aria-expanded="open"
      aria-controls="perf-hud"
      class="flex h-8 cursor-pointer items-center gap-3 rounded-full border border-line px-3 text-[11px] tracking-[0.1em] whitespace-nowrap tabular-nums uppercase transition-colors hover:border-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal motion-reduce:transition-none"
      @click="open = !open"
    >
      <span class="sr-only">Performance of this page</span>
      <span class="hidden sm:inline">
        <span class="text-muted">LCP</span> <span :class="vitalTone('LCP')">{{ vitalText('LCP') ?? '…' }}</span>
      </span>
      <span class="hidden lg:inline">
        <span class="text-muted">INP</span> <span :class="vitalTone('INP')">{{ vitalText('INP') ?? '—' }}</span>
      </span>
      <span><span class="text-ink">{{ snapshot.fps ?? '…' }}</span> <span class="text-muted">fps</span></span>
      <span class="hidden lg:inline">
        <span class="text-muted">JS</span> <span class="text-ink">{{ formatKB(snapshot.resources.js.bytes) }}</span>
      </span>
      <span aria-hidden="true" class="text-muted">{{ open ? '▴' : '▾' }}</span>
    </button>

    <section
      v-show="open"
      id="perf-hud"
      aria-labelledby="perf-hud-title"
      class="fixed inset-x-4 bottom-14 z-40 border border-line bg-surface p-5 shadow-[var(--card-shadow)] sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:bottom-auto sm:mt-2 sm:w-96"
    >
      <h2 id="perf-hud-title" class="font-serif text-2xl leading-tight">Who watches the watchers</h2>
      <p class="mt-1 text-xs text-muted">This page, measured live in your browser. Nothing is sent anywhere.</p>

      <!-- A fixed value column: an auto one widens when a late chunk adds a digit, rewraps the labels and moves the panel. -->
      <dl class="mt-4 grid grid-cols-[1fr_18ch] gap-x-4 gap-y-2 text-xs tabular-nums">
        <dt>Time to first evidence <span class="text-muted">· LCP</span></dt>
        <dd :class="vitalTone('LCP')">{{ vitalText('LCP') ?? lcpMissing() }}</dd>

        <dt>Reaction time <span class="text-muted">· INP</span></dt>
        <dd :class="vitalTone('INP')">{{ vitalText('INP') ?? 'touch something' }}</dd>

        <dt>Board shake <span class="text-muted">· CLS</span></dt>
        <dd :class="vitalTone('CLS')">{{ vitalText('CLS') ?? '0.00' }}</dd>

        <dt>Frame rate <span class="text-muted">· worst frame</span></dt>
        <dd>{{ snapshot.fps ?? '…' }} fps · {{ snapshot.worstMs !== undefined ? formatMs(snapshot.worstMs) : '…' }}</dd>

        <dt>Stalls <span class="text-muted">· frames over 50 ms</span></dt>
        <dd>{{ snapshot.stalls }}</dd>

        <dt class="mt-2 border-t border-line pt-2">Evidence shipped <span class="text-muted">· JS</span></dt>
        <dd class="mt-2 border-t border-line pt-2">
          {{ formatKB(snapshot.resources.js.bytes) }} <span class="text-muted">· {{ snapshot.resources.js.files }} files</span>
        </dd>

        <dt>Styling <span class="text-muted">· CSS</span></dt>
        <dd>{{ formatKB(snapshot.resources.css.bytes) }}</dd>

        <dt>Typefaces <span class="text-muted">· fonts</span></dt>
        <dd>
          {{ formatKB(snapshot.resources.fonts.bytes) }} <span class="text-muted">· {{ snapshot.resources.fonts.files }} files</span>
        </dd>

        <!-- Short values on their own rows, so each fits the value column. -->
        <dt class="mt-2 border-t border-line pt-2">Rumour mill <span class="text-muted">· messages</span></dt>
        <dd class="mt-2 border-t border-line pt-2">{{ snapshot.stream ? `${Math.round(snapshot.stream.perS)}/s` : '…' }}</dd>

        <dt>Cost of listening <span class="text-muted">· main thread</span></dt>
        <dd>{{ snapshot.stream ? `${formatMs(snapshot.stream.msPerS)}/s` : '…' }}</dd>

        <dt>Per message <span class="text-muted">· parse and store</span></dt>
        <dd>{{ snapshot.stream ? formatUs(snapshot.stream.msPerEvent) : '…' }}</dd>

        <dt class="mt-2 border-t border-line pt-2">Cost of watching <span class="text-muted">· this panel</span></dt>
        <dd class="mt-2 border-t border-line pt-2">
          {{ snapshot.costMsPerS !== undefined ? `${formatMs(snapshot.costMsPerS)}/s` : '…' }}
        </dd>
      </dl>

      <div class="mt-4 border-t border-line pt-4">
        <p id="perf-hud-load" class="text-xs">Turn up the chatter <span class="text-muted">· replay Exhibit A</span></p>
        <div class="mt-2 flex gap-2" role="group" aria-labelledby="perf-hud-load">
          <button
            v-for="option in REPLAY_RATES"
            :key="option"
            type="button"
            :aria-pressed="rate === option"
            class="h-8 flex-1 cursor-pointer rounded-full border px-2 label transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal motion-reduce:transition-none"
            :class="rate === option ? 'border-signal text-signal' : 'border-line text-muted hover:text-ink'"
            @click="setReplayRate(option)"
          >
            {{ RATE_LABEL[option] }}
          </button>
        </div>
        <p class="mt-2 text-[11px] text-muted">
          A recorded minute of the Wikipedia stream, played through the same code as the live one.
        </p>
      </div>

      <p class="mt-4 text-[11px] text-muted">
        Sizes are compressed bytes of this site's own files. Idle, the frame rate is your screen's refresh rate.
      </p>
    </section>
  </div>
</template>
