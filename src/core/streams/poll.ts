import { nextDelay } from '../backoff'
import { fetchParsed } from './fetch-json'
import type { StreamStatus } from './sse'

export interface PollOptions<T> {
  url: string
  intervalMs: number
  // Returns `null` to reject a payload; must not throw.
  parse: (json: unknown) => T | null
  onData: (value: T) => void
  onStatus?: (status: StreamStatus) => void
  pauseWhenHidden?: boolean
  fetchFn?: typeof fetch
}

export function poll<T>({
  url,
  intervalMs,
  parse,
  onData,
  onStatus,
  pauseWhenHidden = true,
  fetchFn,
}: PollOptions<T>): () => void {
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
    const value = await fetchParsed(url, parse, { signal: own.signal, fetchFn })
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
