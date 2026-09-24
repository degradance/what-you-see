<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { poll } from '@/core/streams/poll'
import type { StreamStatus } from '@/core/streams/sse'
import { formatKp, formatWhen, kpLevel, layoutChart, summarize, type KpLevel } from './kp'
import { parseKp, type KpSample } from './schema'

// The card header shows the connection state, so the widget only reports it.
const emit = defineEmits<{ status: [status: StreamStatus] }>()

const API = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json'
// NOAA adds a reading every three hours and the file is cached for a minute, so polling faster would only repeat itself.
const POLL_MS = 5 * 60_000

// Full class names, not built strings: Tailwind only generates utilities it can find in the source.
const TEXT_TONE: Record<KpLevel, string> = { quiet: 'text-ink', active: 'text-warn', storm: 'text-signal' }
const BAR_TONE: Record<KpLevel, string> = { quiet: 'fill-muted', active: 'fill-warn', storm: 'fill-signal' }
const LEVEL_LABEL: Record<KpLevel, string> = { quiet: 'quiet', active: 'active', storm: 'storm' }

const samples = shallowRef<KpSample[] | null>(null)

const chart = computed(() => (samples.value ? layoutChart(samples.value) : null))
const summary = computed(() => (samples.value ? summarize(samples.value) : null))
const level = computed(() => (summary.value ? kpLevel(summary.value.latest.kp) : null))

const verdict = computed(() => {
  switch (level.value) {
    case 'storm':
      return 'The sky is misbehaving. Everything is connected. Especially now.'
    case 'active':
      return 'The Sun is stirring. Draw your own conclusions.'
    case 'quiet':
      return 'The Sun is being suspiciously calm.'
    default:
      return 'Consulting the Sun…'
  }
})

const chartLabel = computed(() => {
  const s = summary.value
  return s
    ? `Planetary K-index over the past week. Latest ${formatKp(s.latest.kp)}, peak ${formatKp(s.peak.kp)}, ${s.stormReadings} storm readings.`
    : ''
})

let stopPolling: (() => void) | undefined

onMounted(() => {
  stopPolling = poll({
    url: API,
    intervalMs: POLL_MS,
    parse: parseKp,
    onData: (next) => (samples.value = next),
    onStatus: (s) => emit('status', s),
  })
})

onBeforeUnmount(() => stopPolling?.())
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
      <div>
        <p class="metric" :class="level ? TEXT_TONE[level] : 'text-ink'">
          {{ summary ? formatKp(summary.latest.kp) : '—' }}
        </p>
        <p class="mt-2 caption text-muted">
          Kp index · {{ level ? LEVEL_LABEL[level] : 'no signal' }}
        </p>
      </div>
      <p class="max-w-64 text-xs text-muted">{{ verdict }}</p>
    </div>

    <template v-if="chart && summary">
      <figure class="m-0" role="img" :aria-label="chartLabel">
        <div class="relative h-32">
          <!-- Stretched to the card on purpose: it only holds rectangles, and text lives outside it, so nothing gets squashed. -->
          <svg class="size-full" :viewBox="`0 0 ${chart.width} ${chart.height}`" preserveAspectRatio="none" aria-hidden="true">
            <line
              class="stroke-signal"
              :x2="chart.width"
              :y1="chart.stormY"
              :y2="chart.stormY"
              stroke-width="1"
              stroke-dasharray="4 3"
              vector-effect="non-scaling-stroke"
            />
            <rect
              v-for="bar in chart.bars"
              :key="bar.x"
              :class="[BAR_TONE[bar.level], bar.sample === summary.latest ? '' : 'opacity-70']"
              :x="bar.x"
              :y="bar.y"
              :width="bar.width"
              :height="bar.height"
            >
              <title>{{ formatWhen(bar.sample.time) }} · Kp {{ formatKp(bar.sample.kp) }}</title>
            </rect>
          </svg>
          <span
            class="absolute right-0 -translate-y-full bg-surface pl-2 label-micro text-muted"
            :style="{ top: `${(chart.stormY / chart.height) * 100}%` }"
          >
            Storm · Kp 5
          </span>
        </div>
        <div class="relative mt-1 h-4 text-[10px] text-muted" aria-hidden="true">
          <span v-for="tick in chart.ticks" :key="tick.fraction" class="absolute" :style="{ left: `${tick.fraction * 100}%` }">
            {{ tick.label }}
          </span>
        </div>
      </figure>

      <dl class="grid divide-y divide-line border-y border-line text-xs @xl:grid-cols-3 @xl:divide-x @xl:divide-y-0">
        <div class="flex items-baseline justify-between gap-3 py-1.5 @xl:flex-col @xl:items-start @xl:gap-1 @xl:px-4 @xl:first:pl-0">
          <dt class="label-micro text-muted">Latest reading</dt>
          <dd>{{ formatWhen(summary.latest.time) }}</dd>
        </div>
        <div class="flex items-baseline justify-between gap-3 py-1.5 @xl:flex-col @xl:items-start @xl:gap-1 @xl:px-4">
          <dt class="label-micro text-muted">Peak this week</dt>
          <dd>Kp {{ formatKp(summary.peak.kp) }} · {{ formatWhen(summary.peak.time) }}</dd>
        </div>
        <div class="flex items-baseline justify-between gap-3 py-1.5 @xl:flex-col @xl:items-start @xl:gap-1 @xl:px-4">
          <dt class="label-micro text-muted">Storm readings</dt>
          <dd>{{ summary.stormReadings }} of {{ samples?.length }}</dd>
        </div>
      </dl>
    </template>
    <p v-else class="border-y border-line py-3 text-xs text-muted">Waiting for the first transmission…</p>
  </div>
</template>
