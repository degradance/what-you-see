<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { circle } from '@/core/globe/geo'
import { createGlobe, type Globe, type GlobeFrame } from '@/core/globe/globe'
import { fetchParsed } from '@/core/streams/fetch-json'
import { poll } from '@/core/streams/poll'
import type { StreamStatus } from '@/core/streams/sse'
import { STATUS_LABEL, STATUS_TONE } from '@/core/streams/status'
import { formatKm, formatLat, formatLon } from './format'
import { parsePosition, parsePositions, type Position } from './schema'
import { chunkTrack, footprintRadiusDeg, historyTimestamps, mergeTrack } from './track'

const API = 'https://api.wheretheiss.at/v1/satellites/25544'
// The API allows 350 requests per 5 minutes; this uses 60.
const POLL_MS = 5_000
// One history request (10 timestamps at most) gives the trail a head start instead of an empty first half hour.
const HISTORY_COUNT = 10
const HISTORY_STEP_S = 120
const TRAIL_WINDOW_MS = 30 * 60_000
const TRAIL_CHUNKS = 6
const PULSE_MS = 2_000
const TAU = Math.PI * 2

const status = ref<StreamStatus>('connecting')
const position = shallowRef<Position | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)

// The frame loop reads this plain copy so it never goes through Vue's reactivity.
let track: Position[] = []
let trailChunks: { type: 'LineString'; coordinates: [number, number][] }[] = []
let footprint: ReturnType<typeof circle> | null = null
let current: Position | null = null

function rebuildScene() {
  trailChunks = chunkTrack(track, TRAIL_CHUNKS).map((coordinates) => ({ type: 'LineString', coordinates }))
  footprint = current ? circle(current.lon, current.lat, footprintRadiusDeg(current.footprintKm)) : null
  globe?.invalidate()
}

function overlay({ ctx, now, palette, motion, project, trace }: GlobeFrame) {
  if (!current || !footprint) return

  trace(footprint)
  ctx.globalAlpha = 0.12
  ctx.fillStyle = palette.signal
  ctx.fill()
  ctx.globalAlpha = 0.55
  ctx.strokeStyle = palette.signal
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  trailChunks.forEach((chunk, i) => {
    ctx.globalAlpha = 0.15 + (0.75 * (i + 1)) / trailChunks.length
    trace(chunk)
    ctx.stroke()
  })

  const point = project(current.lon, current.lat)
  if (!point) {
    ctx.globalAlpha = 1
    return
  }
  const [x, y] = point

  ctx.globalAlpha = 1
  ctx.strokeStyle = palette.ink
  ctx.lineWidth = 1
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    ctx.beginPath()
    ctx.moveTo(x + dx * 8, y + dy * 8)
    ctx.lineTo(x + dx * 13, y + dy * 13)
    ctx.stroke()
  }

  if (motion) {
    const phase = (now % PULSE_MS) / PULSE_MS
    ctx.globalAlpha = (1 - phase) * 0.8
    ctx.strokeStyle = palette.signal
    ctx.beginPath()
    ctx.arc(x, y, 4 + phase * 12, 0, TAU)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  ctx.fillStyle = palette.signal
  ctx.strokeStyle = palette.surface
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(x, y, 4, 0, TAU)
  ctx.fill()
  ctx.stroke()
}

function onData(next: Position) {
  current = next
  position.value = next
  track = mergeTrack(track, [next], Date.now(), TRAIL_WINDOW_MS)
  globe?.follow({ lon: next.lon, lat: next.lat })
  rebuildScene()
}

let globe: Globe | undefined
let stopPolling: (() => void) | undefined
const backfill = new AbortController()
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const syncMotion = () => globe?.setMotion(!reducedMotion.matches)

onMounted(async () => {
  if (canvas.value) {
    globe = createGlobe({ canvas: canvas.value, overlay })
    syncMotion()
  }
  reducedMotion.addEventListener('change', syncMotion)
  stopPolling = poll({
    url: API,
    intervalMs: POLL_MS,
    parse: parsePosition,
    onData,
    onStatus: (s) => (status.value = s),
  })

  const timestamps = historyTimestamps(Date.now(), HISTORY_COUNT, HISTORY_STEP_S)
  const history = await fetchParsed(
    `${API}/positions?timestamps=${timestamps.join(',')}&units=kilometers`,
    parsePositions,
    { signal: backfill.signal },
  )
  if (history) {
    track = mergeTrack(track, history, Date.now(), TRAIL_WINDOW_MS)
    rebuildScene()
  }
})

onBeforeUnmount(() => {
  backfill.abort()
  stopPolling?.()
  globe?.dispose()
  reducedMotion.removeEventListener('change', syncMotion)
})
</script>

<template>
  <div class="flex flex-col gap-4 @xl:grid @xl:grid-cols-2 @xl:grid-rows-[auto_auto_1fr] @xl:items-start @xl:gap-x-8">
    <div class="flex items-end justify-between gap-4 @xl:col-start-2">
      <div>
        <p class="font-serif text-7xl leading-none text-ink">
          {{ position ? formatKm(position.speedKmh) : '—' }}
        </p>
        <p class="mt-2 text-xs tracking-[0.18em] text-muted uppercase">km/h · orbital speed</p>
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
      class="aspect-square w-full cursor-grab touch-pan-y active:cursor-grabbing @xl:col-start-1 @xl:row-span-3 @xl:row-start-1"
      aria-hidden="true"
    />

    <p class="text-xs text-muted @xl:col-start-2">
      <template v-if="position">Field of view: {{ formatKm(position.footprintKm) }} km wide.</template>
      <template v-else>Field of view: unknown.</template>
      <br />
      Currently observing: everyone in it. Drag to look away.
    </p>

    <dl v-if="position" class="divide-y divide-line border-y border-line text-xs @xl:col-start-2">
      <div class="flex items-baseline justify-between gap-3 py-1.5">
        <dt class="text-[10px] tracking-[0.18em] text-muted uppercase">Latitude</dt>
        <dd>{{ formatLat(position.lat) }}</dd>
      </div>
      <div class="flex items-baseline justify-between gap-3 py-1.5">
        <dt class="text-[10px] tracking-[0.18em] text-muted uppercase">Longitude</dt>
        <dd>{{ formatLon(position.lon) }}</dd>
      </div>
      <div class="flex items-baseline justify-between gap-3 py-1.5">
        <dt class="text-[10px] tracking-[0.18em] text-muted uppercase">Altitude</dt>
        <dd>{{ formatKm(position.altitudeKm) }} km</dd>
      </div>
      <div class="flex items-baseline justify-between gap-3 py-1.5">
        <dt class="text-[10px] tracking-[0.18em] text-muted uppercase">Sunlight</dt>
        <dd>{{ position.visibility }}</dd>
      </div>
    </dl>
    <p v-else class="border-y border-line py-3 text-xs text-muted @xl:col-start-2">Waiting for the first transmission…</p>
  </div>
</template>
