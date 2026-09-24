import { streamMeter } from '@/core/perf/stream'
import { ChangePipeline, sourceFor, type FromWorker, type ToWorker } from './pipeline'
import { parseChange } from './schema'

// The stream, the parser and the buffers live here; the page gets one small snapshot per flush.
const FLUSH_MS = 250

// Typed by hand: the project's `lib` is the DOM one, where `postMessage` takes a target origin.
const scope = self as unknown as {
  postMessage: (message: FromWorker) => void
  onmessage: ((event: MessageEvent<ToWorker>) => void) | null
}

let dispose: (() => void) | undefined
let timer: ReturnType<typeof setInterval> | undefined

function stop() {
  dispose?.()
  dispose = undefined
  clearInterval(timer)
}

function start(rate: number) {
  stop()
  // A fresh average per source: a rate that mixes live seconds with ×100 seconds describes neither.
  const pipeline = new ChangePipeline()
  dispose = sourceFor(rate, false)({
    parse: parseChange,
    onMessage: (change) => pipeline.add(change, Date.now()),
    onStatus: (status) => scope.postMessage({ type: 'status', status }),
  })
  timer = setInterval(() => {
    const { events, ms } = streamMeter.take()
    scope.postMessage({ type: 'snapshot', snapshot: pipeline.snapshot(Date.now()), events, ms })
  }, FLUSH_MS)
}

scope.onmessage = ({ data }) => {
  if (data.type === 'start') start(data.rate)
  else stop()
}
