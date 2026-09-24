import { RateCounter } from '@/core/rate-counter'
import { RingBuffer } from '@/core/ring-buffer'
import { replaySource } from '@/core/streams/replay'
import type { Source } from '@/core/streams/source'
import { sseSource, type StreamStatus } from '@/core/streams/sse'
import { FEED_SIZE, RATE_WINDOW_S } from './layout'
import { toRecording, type RecordedStream } from './recording'
import type { Change } from './schema'

const STREAM_URL = 'https://stream.wikimedia.org/v2/stream/recentchange'

export interface Snapshot {
  humansPerSec: number
  botsPerSec: number
  // Only when it changed since the last snapshot, so an idle feed costs nothing to post or render.
  feed?: Change[]
}

// Everything Exhibit A does per message, with no Vue in it, so it runs the same on the main thread or in a worker.
export class ChangePipeline {
  private humans = new RateCounter(RATE_WINDOW_S)
  private bots = new RateCounter(RATE_WINDOW_S)
  private readonly latest = new RingBuffer<Change>(FEED_SIZE)
  private dirty = false

  add(change: Change, now: number): void {
    ;(change.bot ? this.bots : this.humans).add(now)
    this.latest.push(change)
    this.dirty = true
  }

  snapshot(now: number): Snapshot {
    const snapshot: Snapshot = { humansPerSec: this.humans.perSecond(now), botsPerSec: this.bots.perSecond(now) }
    if (this.dirty) {
      snapshot.feed = this.latest.latest()
      this.dirty = false
    }
    return snapshot
  }
}

// The recording is its own chunk: only a visitor who turns the load up downloads it. It is built by our own
// script and bundled, not fetched, so it is typed rather than validated; JSON imports widen tuples to arrays.
const loadRecording = () =>
  import('./recording.json').then((m) => toRecording(m.default as unknown as RecordedStream))

export const sourceFor = (rate: number, pauseWhenHidden: boolean): Source =>
  rate === 0 ? sseSource(STREAM_URL, pauseWhenHidden) : replaySource(loadRecording, rate, pauseWhenHidden)

// The worker's conversation with the widget.
export type ToWorker = { type: 'start'; rate: number } | { type: 'pause' }
export type FromWorker =
  | { type: 'status'; status: StreamStatus }
  | { type: 'snapshot'; snapshot: Snapshot; events: number; ms: number }
