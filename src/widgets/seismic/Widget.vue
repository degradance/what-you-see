<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { createGlobe, type Globe, type GlobeFrame } from '@/core/globe/globe'
import { poll } from '@/core/streams/poll'
import type { StreamStatus } from '@/core/streams/sse'
import { formatAgo, isRecent, markerRadius } from './quakes'
import { parseQuakes, type Quake } from './schema'

const FEED_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson'
// The feed is cached for 60 s upstream; asking faster only returns the same bytes.
const POLL_MS = 60_000
const LATEST_COUNT = 4
const PULSE_MS = 2_400
const TAU = Math.PI * 2

const status = ref<StreamStatus>('connecting')
const quakes = shallowRef<Quake[]>([])
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

const STATUS_LABEL: Record<StreamStatus, string> = {
  connecting: 'Connecting',
  live: 'Live',
  reconnecting: 'Signal lost',
  paused: 'Paused · tab hidden',
}
const STATUS_TONE: Record<StreamStatus, string> = {
  connecting: 'text-warn',
  live: 'text-live',
  reconnecting: 'text-signal',
  paused: 'text-muted',
}

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
    onStatus: (s) => (status.value = s),
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
  <div class="flex flex-col gap-4">
    <div class="flex items-end justify-between gap-4">
      <div>
        <p class="font-serif text-7xl leading-none text-ink">{{ quakes.length }}</p>
        <p class="mt-2 text-xs tracking-[0.18em] text-muted uppercase">events · past 24 h</p>
      </div>
      <p
        class="flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase"
        :class="STATUS_TONE[status]"
        role="status"
      >
        <span
          class="size-2 rounded-full bg-current"
          :class="{ 'motion-safe:animate-pulse': status === 'live' }"
          aria-hidden="true"
        />
        {{ STATUS_LABEL[status] }}
      </p>
    </div>

    <canvas
      ref="canvas"
      class="aspect-square w-full cursor-grab touch-pan-y active:cursor-grabbing"
      aria-hidden="true"
    />

    <p class="text-xs text-muted">
      <span class="text-signal">●</span> {{ lastHour }} in the last hour ·
      <span v-if="strongest">strongest M {{ strongest.mag.toFixed(1) }}</span>
      <span v-else>strongest —</span>
      <br />
      Correlation with anything: none. Drag the globe.
    </p>

    <ol class="divide-y divide-line border-y border-line text-xs">
      <li v-for="quake in latest" :key="quake.id" class="flex items-baseline gap-3 py-1.5">
        <span class="w-9 shrink-0 text-ink">M {{ quake.mag.toFixed(1) }}</span>
        <span class="min-w-0 flex-1 truncate">{{ quake.place }}</span>
        <span class="shrink-0 text-[10px] tracking-[0.18em] text-muted uppercase">
          {{ formatAgo(quake.time, now) }}
        </span>
      </li>
      <li v-if="latest.length === 0" class="py-3 text-muted">Waiting for the first transmission…</li>
    </ol>
  </div>
</template>
