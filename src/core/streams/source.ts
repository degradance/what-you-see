import { streamMeter } from '../perf/stream'
import type { StreamStatus } from './sse'

export interface StreamHandlers<T> {
  // Returns `null` to drop a message; must not throw.
  parse: (data: string) => T | null
  onMessage: (value: T) => void
  onStatus?: (status: StreamStatus) => void
}

// Anything that delivers raw messages: the live stream or a recording of it. A widget's pipeline cannot tell which,
// so a replay at ×100 exercises exactly the code that the live stream runs.
export type Source = <T>(handlers: StreamHandlers<T>) => () => void

// The hot path of every source. Timing it here gives the panel the cost of the whole pipeline per message.
export function deliver<T>(data: string, { parse, onMessage }: StreamHandlers<T>): void {
  const start = performance.now()
  const value = parse(data)
  if (value !== null) onMessage(value)
  streamMeter.record(performance.now() - start)
}
