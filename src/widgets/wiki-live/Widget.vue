<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { streamMeter } from '@/core/perf/stream'
import { onPipelineMode, onReplayRate, pipelineMode, replayRate } from '@/core/streams/load'
import type { StreamStatus } from '@/core/streams/sse'
import { FEED_SIZE, RATE_WINDOW_S } from './layout'
import { ChangePipeline, sourceFor, type FromWorker, type Snapshot, type ToWorker } from './pipeline'
import { parseChange, type Change } from './schema'
import Skeleton from './Skeleton.vue'

// The card header shows the connection state, so the widget only reports it.
const emit = defineEmits<{ status: [status: StreamStatus] }>()

const FLUSH_MS = 250

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

// The only place reactive state is touched, four times a second, whichever thread did the work.
function apply(snapshot: Snapshot) {
  humansPerSec.value = snapshot.humansPerSec
  botsPerSec.value = snapshot.botsPerSec
  if (snapshot.feed) {
    feed.value = snapshot.feed
    ready.value = true
  }
}

const onStatus = (status: StreamStatus) => emit('status', status)

// Hot path on the main thread: plain objects, no reactivity until the flush. With `everyMessage` the flush runs
// after each message instead: the comparison the panel offers, not a way the board should run.
function runOnMain(rate: number, everyMessage = false): () => void {
  const pipeline = new ChangePipeline()
  const dispose = sourceFor(rate, true)({
    parse: parseChange,
    onMessage: (change) => {
      const now = Date.now()
      pipeline.add(change, now)
      if (everyMessage) apply(pipeline.snapshot(now))
    },
    onStatus,
  })
  const timer = everyMessage ? undefined : setInterval(() => apply(pipeline.snapshot(Date.now())), FLUSH_MS)
  return () => {
    dispose()
    clearInterval(timer)
  }
}

// The same pipeline in a worker. A worker has no document, so the page pauses it when the tab is hidden.
function runInWorker(rate: number): () => void {
  const worker = new Worker(new URL('./pipeline.worker.ts', import.meta.url), { type: 'module' })
  const send = (message: ToWorker) => worker.postMessage(message)
  worker.onmessage = ({ data }: MessageEvent<FromWorker>) => {
    if (data.type === 'status') return onStatus(data.status)
    streamMeter.addOffThread(data.events, data.ms)
    apply(data.snapshot)
  }
  worker.onerror = () => onStatus('reconnecting')
  const onVisibilityChange = () => {
    if (!document.hidden) return send({ type: 'start', rate })
    send({ type: 'pause' })
    onStatus('paused')
  }
  document.addEventListener('visibilitychange', onVisibilityChange)
  if (document.hidden) onStatus('paused')
  else send({ type: 'start', rate })
  return () => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    worker.terminate()
  }
}

let dispose: (() => void) | undefined
const stops: (() => void)[] = []

function connect() {
  dispose?.()
  const mode = pipelineMode()
  dispose = mode === 'worker' ? runInWorker(replayRate()) : runOnMain(replayRate(), mode === 'naive')
}

onMounted(() => {
  connect()
  stops.push(onReplayRate(connect), onPipelineMode(connect))
})

onBeforeUnmount(() => {
  stops.forEach((stop) => stop())
  dispose?.()
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
