<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { RateCounter } from '@/core/rate-counter'
import { RingBuffer } from '@/core/ring-buffer'
import { connectSSE, type StreamStatus } from '@/core/streams/sse'
import { parseChange, type Change } from './schema'

// The card header shows the connection state, so the widget only reports it.
const emit = defineEmits<{ status: [status: StreamStatus] }>()

const STREAM_URL = 'https://stream.wikimedia.org/v2/stream/recentchange'
const FEED_SIZE = 8
const RATE_WINDOW_S = 10
const FLUSH_MS = 250

// Hot path: plain objects, no reactivity. Reactive state is only touched from `flush`.
const humanRate = new RateCounter(RATE_WINDOW_S)
const botRate = new RateCounter(RATE_WINDOW_S)
const latest = new RingBuffer<Change>(FEED_SIZE)
let dirty = false

const feed = shallowRef<Change[]>([])
const humansPerSec = ref(0)
const botsPerSec = ref(0)

const total = computed(() => humansPerSec.value + botsPerSec.value)
// A fixed set of rows keyed by position: new edits rewrite the text in place instead of pushing every row down,
// which the browser would count as a layout shift four times a second. Empty slots hold the height from the start.
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
    dirty = false
  }
}

let dispose: (() => void) | undefined
let flushTimer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  dispose = connectSSE({
    url: STREAM_URL,
    parse: parseChange,
    onMessage: onChange,
    onStatus: (s) => emit('status', s),
  })
  flushTimer = setInterval(flush, FLUSH_MS)
})

onBeforeUnmount(() => {
  dispose?.()
  clearInterval(flushTimer)
})
</script>

<template>
  <div class="flex flex-col gap-5">
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
        <span v-else-if="i === 0 && feed.length === 0" class="text-muted">Waiting for the first transmission…</span>
        <span v-else aria-hidden="true">&nbsp;</span>
      </li>
    </ol>
  </div>
</template>
