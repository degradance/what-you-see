import { deliver, type Source } from './source'

export interface Recording {
  durationMs: number
  // Sorted by `at`, in ms from the start of the recording; `data` is the message exactly as the live stream sends it.
  events: readonly { at: number; data: string }[]
}

// Walks a recording in virtual time and loops it, so a replay can run for as long as the visitor watches.
export class ReplayCursor {
  private index = 0
  private position = 0

  constructor(private readonly recording: Recording) {}

  // Moves `elapsedMs` of recording time forward and emits every message it passes.
  advance(elapsedMs: number, emit: (data: string) => void): void {
    const { events, durationMs } = this.recording
    if (events.length === 0 || durationMs <= 0) return
    let target = this.position + elapsedMs
    while (target >= durationMs) {
      while (this.index < events.length) emit(events[this.index++]!.data)
      this.index = 0
      target -= durationMs
    }
    while (this.index < events.length && events[this.index]!.at <= target) emit(events[this.index++]!.data)
    this.position = target
  }
}

// A timer delivers everything that became due since its last tick. One timer per message would cost more at ×100
// than the messages themselves, and the live stream also arrives in network-sized batches.
const TICK_MS = 20

export function replaySource(load: () => Promise<Recording>, rate: number): Source {
  return (handlers) => {
    let timer: ReturnType<typeof setInterval> | undefined
    let disposed = false
    let cursor: ReplayCursor | undefined
    let last = 0

    const tick = () => {
      const now = performance.now()
      cursor?.advance((now - last) * rate, (data) => deliver(data, handlers))
      last = now
    }
    const start = () => {
      if (!cursor || timer !== undefined) return
      last = performance.now()
      timer = setInterval(tick, TICK_MS)
      handlers.onStatus?.('replay')
    }
    const stop = () => {
      clearInterval(timer)
      timer = undefined
    }
    const onVisibilityChange = () => {
      if (!document.hidden) return start()
      stop()
      handlers.onStatus?.('paused')
    }

    handlers.onStatus?.('connecting')
    document.addEventListener('visibilitychange', onVisibilityChange)
    load().then(
      (recording) => {
        if (disposed) return
        cursor = new ReplayCursor(recording)
        if (document.hidden) handlers.onStatus?.('paused')
        else start()
      },
      () => !disposed && handlers.onStatus?.('reconnecting'),
    )

    return () => {
      disposed = true
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }
}
