<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { RateCounter } from '@/core/rate-counter'
import { RingBuffer } from '@/core/ring-buffer'
import { onReplayRate, replayRate, type ReplayRate } from '@/core/streams/load'
import { replaySource } from '@/core/streams/replay'
import { sseSource, type StreamStatus } from '@/core/streams/sse'
import { FEED_SIZE, RATE_WINDOW_S } from './layout'
import { toRecording, type RecordedStream } from './recording'
import { parseChange, type Change } from './schema'
import Skeleton from './Skeleton.vue'

// The card header shows the connection state, so the widget only reports it.
const emit = defineEmits<{ status: [status: StreamStatus] }>()

const STREAM_URL = 'https://stream.wikimedia.org/v2/stream/recentchange'
const FLUSH_MS = 250

// Hot path: plain objects, no reactivity. Reactive state is only touched from `flush`.
let humanRate = new RateCounter(RATE_WINDOW_S)
let botRate = new RateCounter(RATE_WINDOW_S)
const latest = new RingBuffer<Change>(FEED_SIZE)
let dirty = false

const feed = shallowRef<Change[]>([])
const ready = ref(false)
const humansPerSec = ref(0)
const botsPerSec = ref(0)

const total = computed(() => humansPerSec.value + botsPerSec.value)
// A fixed set of rows keyed by position: new edits rewrite the text in place instead of pushing every row down,
// which the browser would count as a layout shift four times a second.
const slots = computed(() => Array.from({ length: FEED_SIZE }, (_, i) => feed.value[i]))
const botShare = computed(() =>
  total.value > 0 ? Math.round((botsPerSec.value / total.value) * 100) : 0,
)

function onChange(change: Change) {
  ;(change.bot ? botRate : humanRate).add(Date.now())
  latest.push(change)
  dirty = true
}

function flush() {
  const now = Date.now()
  humansPerSec.value = humanRate.perSecond(now)
  botsPerSec.value = botRate.perSecond(now)
  if (dirty) {
    feed.value = latest.latest()
    ready.value = true
    dirty = false
  }
}

// The recording is its own chunk: only a visitor who turns the load up downloads it. It is built by our own
// script and bundled, not fetched, so it is typed rather than validated; JSON imports widen tuples to arrays.
const loadRecording = () =>
  import('./recording.json').then((m) => toRecording(m.default as unknown as RecordedStream))

let dispose: (() => void) | undefined
let flushTimer: ReturnType<typeof setInterval> | undefined
let stopFollowing: (() => void) | undefined

function connect(rate: ReplayRate) {
  dispose?.()
  // A fresh average per source: a rate that mixes live seconds with ×100 seconds describes neither.
  humanRate = new RateCounter(RATE_WINDOW_S)
  botRate = new RateCounter(RATE_WINDOW_S)
  const source = rate === 0 ? sseSource(STREAM_URL) : replaySource(loadRecording, rate)
  dispose = source({ parse: parseChange, onMessage: onChange, onStatus: (s) => emit('status', s) })
}

onMounted(() => {
  connect(replayRate())
  stopFollowing = onReplayRate(connect)
  flushTimer = setInterval(flush, FLUSH_MS)
})

onBeforeUnmount(() => {
  stopFollowing?.()
  dispose?.()
  clearInterval(flushTimer)
})
</script>

<template>
  <Skeleton v-if="!ready" />
  <div v-else class="flex flex-col gap-5 motion-safe:declassify">
    <div>
      <div>
        <p class="metric text-ink">{{ total.toFixed(1) }}</p>
        <p class="mt-2 caption text-muted">
          edits per second · {{ RATE_WINDOW_S }} s average
        </p>
      </div>
    </div>

    <div>
      <div class="h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div
          class="h-full bg-signal transition-[width] duration-500 motion-reduce:transition-none"
          :style="{ width: botShare + '%' }"
        />
      </div>
      <p class="mt-2 text-xs text-muted">{{ 100 - botShare }}% humans · {{ botShare }}% bots</p>
    </div>

    <ol class="divide-y divide-line border-y border-line text-xs">
      <li v-for="(change, i) in slots" :key="i" class="flex items-baseline gap-3 py-1.5">
        <template v-if="change">
          <span class="w-36 shrink-0 truncate text-muted">{{ change.meta.domain }}</span>
          <span class="min-w-0 flex-1 truncate">{{ change.title }}</span>
          <span class="shrink-0 label-micro text-muted">
            {{ change.type === 'new' ? 'new' : change.bot ? 'bot' : 'edit' }}
          </span>
        </template>
        <span v-else aria-hidden="true">&nbsp;</span>
      </li>
    </ol>
  </div>
</template>
