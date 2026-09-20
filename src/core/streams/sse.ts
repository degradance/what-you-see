import { nextDelay } from '../backoff'

export type StreamStatus = 'connecting' | 'live' | 'reconnecting' | 'paused'

export interface SseOptions<T> {
  url: string
  // Returns `null` to drop a message; must not throw.
  parse: (data: string) => T | null
  onMessage: (value: T) => void
  onStatus?: (status: StreamStatus) => void
  pauseWhenHidden?: boolean
}

export function connectSSE<T>({
  url,
  parse,
  onMessage,
  onStatus,
  pauseWhenHidden = true,
}: SseOptions<T>): () => void {
  let source: EventSource | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let attempt = 0
  let disposed = false

  const close = () => {
    clearTimeout(timer)
    source?.close()
    source = null
  }

  const open = () => {
    close()
    onStatus?.(attempt === 0 ? 'connecting' : 'reconnecting')
    source = new EventSource(url)
    source.onopen = () => {
      attempt = 0
      onStatus?.('live')
    }
    source.onmessage = (event: MessageEvent<string>) => {
      const value = parse(event.data)
      if (value !== null) onMessage(value)
    }
    source.onerror = () => {
      // EventSource gives up on some failures; take over so backoff applies to all of them.
      close()
      if (disposed) return
      onStatus?.('reconnecting')
      timer = setTimeout(open, nextDelay(attempt++))
    }
  }

  const onVisibilityChange = () => {
    if (document.hidden) {
      close()
      onStatus?.('paused')
    } else if (!source) {
      attempt = 0
      open()
    }
  }

  if (pauseWhenHidden) document.addEventListener('visibilitychange', onVisibilityChange)
  if (pauseWhenHidden && document.hidden) onStatus?.('paused')
  else open()

  return () => {
    disposed = true
    close()
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
}
