<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { RateCounter } from '@/core/rate-counter'
import { RingBuffer } from '@/core/ring-buffer'
import { connectSSE, type StreamStatus } from '@/core/streams/sse'
import { STATUS_LABEL, STATUS_TONE } from '@/core/streams/status'
import { parseChange, type Change } from './schema'

const STREAM_URL = 'https://stream.wikimedia.org/v2/stream/recentchange'
const FEED_SIZE = 8
const RATE_WINDOW_S = 10
const FLUSH_MS = 250

// Hot path: plain objects, no reactivity. Reactive state is only touched from `flush`.
const humanRate = new RateCounter(RATE_WINDOW_S)
const botRate = new RateCounter(RATE_WINDOW_S)
const latest = new RingBuffer<Change>(FEED_SIZE)
let dirty = false

const status = ref<StreamStatus>('connecting')
const feed = shallowRef<Change[]>([])
const humansPerSec = ref(0)
const botsPerSec = ref(0)

const total = computed(() => humansPerSec.value + botsPerSec.value)
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
    onStatus: (s) => (status.value = s),
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
    <div class="flex items-end justify-between gap-4">
      <div>
        <p class="font-serif text-7xl leading-none text-ink">{{ total.toFixed(1) }}</p>
        <p class="mt-2 text-xs tracking-[0.18em] text-muted uppercase">
          edits per second · {{ RATE_WINDOW_S }} s average
        </p>
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
      <li v-for="change in feed" :key="change.meta.id" class="flex items-baseline gap-3 py-1.5">
        <span class="w-36 shrink-0 truncate text-muted">{{ change.meta.domain }}</span>
        <span class="min-w-0 flex-1 truncate">{{ change.title }}</span>
        <span class="shrink-0 text-[10px] tracking-[0.18em] text-muted uppercase">
          {{ change.type === 'new' ? 'new' : change.bot ? 'bot' : 'edit' }}
        </span>
      </li>
      <li v-if="feed.length === 0" class="py-3 text-muted">Waiting for the first transmission…</li>
    </ol>
  </div>
</template>
