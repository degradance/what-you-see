import { nextDelay } from '../backoff'
import { fetchParsed } from './fetch-json'
import type { StreamStatus } from './sse'

export interface PollTaskOptions<T> {
  // Returns `null` when the round failed; must not throw. `signal` aborts a round that is superseded or disposed.
  load: (signal: AbortSignal) => Promise<T | null>
  intervalMs: number
  onData: (value: T) => void
  onStatus?: (status: StreamStatus) => void
  pauseWhenHidden?: boolean
}

export interface PollOptions<T> extends Omit<PollTaskOptions<T>, 'load'> {
  url: string
  // Returns `null` to reject a payload; must not throw.
  parse: (json: unknown) => T | null
  fetchFn?: typeof fetch
}

// For feeds that take more than one request per round, such as a list of ids followed by one call per item.
export function pollTask<T>({
  load,
  intervalMs,
  onData,
  onStatus,
  pauseWhenHidden = true,
}: PollTaskOptions<T>): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | null = null
  let attempt = 0
  let disposed = false

  const stop = () => {
    clearTimeout(timer)
    controller?.abort()
    controller = null
  }

  const tick = async () => {
    const own = new AbortController()
    controller = own
    const value = await load(own.signal)
    // A superseded or disposed request must not reschedule: the new one already owns the timer.
    if (own.signal.aborted) return
    if (value === null) {
      onStatus?.('reconnecting')
      timer = setTimeout(tick, nextDelay(attempt++))
      return
    }
    attempt = 0
    onStatus?.('live')
    onData(value)
    timer = setTimeout(tick, intervalMs)
  }

  const start = () => {
    stop()
    onStatus?.(attempt === 0 ? 'connecting' : 'reconnecting')
    void tick()
  }

  const onVisibilityChange = () => {
    if (document.hidden) {
      stop()
      onStatus?.('paused')
    } else if (!disposed) {
      attempt = 0
      start()
    }
  }

  if (pauseWhenHidden) document.addEventListener('visibilitychange', onVisibilityChange)
  if (pauseWhenHidden && document.hidden) onStatus?.('paused')
  else start()

  return () => {
    disposed = true
    stop()
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
}

export function poll<T>({ url, parse, fetchFn, ...rest }: PollOptions<T>): () => void {
  return pollTask({ ...rest, load: (signal) => fetchParsed(url, parse, { signal, fetchFn }) })
}
