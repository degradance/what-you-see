<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { createGlobe, type Globe, type GlobeFrame } from '@/core/globe/globe'
import { poll } from '@/core/streams/poll'
import type { StreamStatus } from '@/core/streams/sse'
import { LATEST_COUNT } from './layout'
import { formatAgo, isRecent, markerRadius } from './quakes'
import { parseQuakes, type Quake } from './schema'

// The card header shows the connection state, so the widget only reports it.
const emit = defineEmits<{ status: [status: StreamStatus] }>()

const FEED_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson'
// The feed is cached for 60 s upstream; asking faster only returns the same bytes.
const POLL_MS = 60_000
const PULSE_MS = 2_400
const TAU = Math.PI * 2

const quakes = shallowRef<Quake[]>([])
// The globe keeps its canvas from the first frame, so until the feed answers only the numbers are blacked out.
const loaded = ref(false)
const now = ref(Date.now())
const canvas = ref<HTMLCanvasElement | null>(null)

// The frame loop reads this plain copy so it never goes through Vue's reactivity.
let drawList: readonly Quake[] = []

const lastHour = computed(() => quakes.value.filter((q) => isRecent(q.time, now.value)).length)
const strongest = computed(() =>
  quakes.value.reduce<Quake | null>((best, q) => (best && best.mag >= q.mag ? best : q), null),
)
const latest = computed(() =>
  [...quakes.value].sort((a, b) => b.time - a.time).slice(0, LATEST_COUNT),
)

function overlay({ ctx, now: t, palette, motion, project }: GlobeFrame) {
  for (const quake of drawList) {
    const point = project(quake.lon, quake.lat)
    if (!point) continue
    const [x, y] = point
    const radius = markerRadius(quake.mag)
    const recent = isRecent(quake.time, t)

    ctx.globalAlpha = recent ? 0.95 : 0.55
    ctx.fillStyle = recent ? palette.signal : palette.ink
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, TAU)
    ctx.fill()

    if (!recent) continue
    // Offsetting by the quake time keeps neighbouring pulses out of step.
    const phase = motion ? ((t + quake.time) % PULSE_MS) / PULSE_MS : 0.3
    ctx.globalAlpha = motion ? (1 - phase) * 0.8 : 0.7
    ctx.strokeStyle = palette.signal
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(x, y, radius + 2 + phase * radius * 2.5, 0, TAU)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function onData(list: Quake[]) {
  now.value = Date.now()
  quakes.value = list
  loaded.value = true
  // Largest first, so the small quakes are drawn on top of the big ones instead of hidden under them.
  drawList = [...list].sort((a, b) => b.mag - a.mag)
  globe?.invalidate()
}

let globe: Globe | undefined
let stopPolling: (() => void) | undefined
let clock: ReturnType<typeof setInterval> | undefined
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const syncMotion = () => globe?.setMotion(!reducedMotion.matches)

onMounted(() => {
  if (canvas.value) {
    globe = createGlobe({ canvas: canvas.value, overlay })
    syncMotion()
  }
  reducedMotion.addEventListener('change', syncMotion)
  stopPolling = poll({
    url: FEED_URL,
    intervalMs: POLL_MS,
    parse: parseQuakes,
    onData,
    onStatus: (s) => emit('status', s),
  })
  clock = setInterval(() => (now.value = Date.now()), 30_000)
})

onBeforeUnmount(() => {
  stopPolling?.()
  globe?.dispose()
  reducedMotion.removeEventListener('change', syncMotion)
  clearInterval(clock)
})
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 @xl:grid @xl:grid-cols-2 @xl:grid-rows-[auto_auto_1fr] @xl:items-start @xl:gap-x-8">
    <div class="@xl:col-start-2">
      <div>
        <p class="metric text-ink">
          <span v-if="loaded" class="motion-safe:declassify">{{ quakes.length }}</span>
          <span v-else class="redacted">00</span>
        </p>
        <p class="mt-2 caption text-muted">events · past 24 h</p>
      </div>
    </div>

    <canvas
      ref="canvas"
      class="aspect-square w-full cursor-grab touch-pan-y active:cursor-grabbing @xl:col-start-1 @xl:row-span-3 @xl:row-start-1"
      aria-hidden="true"
    />

    <p class="text-xs text-muted @xl:col-start-2">
      <span class="text-signal">●</span>
      <span v-if="!loaded" class="redacted">0 in the last hour · strongest M 0.0</span>
      <span v-else class="motion-safe:declassify">
        {{ lastHour }} in the last hour ·
        <template v-if="strongest">strongest M {{ strongest.mag.toFixed(1) }}</template>
        <template v-else>strongest —</template>
      </span>
      <br />
      Correlation with anything: none. Drag the globe.
    </p>

    <ol
      class="min-h-0 shrink basis-[7.25rem] grow divide-y divide-line overflow-hidden border-t border-line text-xs lg:[mask-image:linear-gradient(to_bottom,#000_calc(100%-2rem),transparent)] @xl:col-start-2 @xl:border-y @xl:[mask-image:none]"
    >
      <li
        v-for="quake in latest"
        :key="quake.id"
        class="flex items-baseline gap-3 py-1.5 @xl:nth-[n+5]:hidden"
      >
        <span class="w-9 shrink-0 text-ink">M {{ quake.mag.toFixed(1) }}</span>
        <span class="min-w-0 flex-1 truncate">{{ quake.place }}</span>
        <span class="shrink-0 label-micro text-muted">
          {{ formatAgo(quake.time, now) }}
        </span>
      </li>
      <template v-if="!loaded">
        <li v-for="i in LATEST_COUNT" :key="i" class="flex items-baseline gap-3 py-1.5 @xl:nth-[n+5]:hidden" aria-hidden="true">
          <span class="w-9 shrink-0"><span class="redacted">M 0.0</span></span>
          <span class="min-w-0 flex-1 truncate"><span class="redacted">Kermadec Islands</span></span>
          <span class="shrink-0 label-micro"><span class="redacted">00 min</span></span>
        </li>
      </template>
    </ol>
  </div>
</template>
