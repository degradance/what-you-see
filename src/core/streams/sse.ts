import { nextDelay } from '../backoff'
import { deliver, type Source } from './source'

// `replay` is a recording played back by the load generator: the card must not call it live.
export type StreamStatus = 'connecting' | 'live' | 'replay' | 'reconnecting' | 'paused'

export const sseSource = (url: string, pauseWhenHidden = true): Source => (handlers) => {
  const { onStatus } = handlers
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
    source.onmessage = (event: MessageEvent<string>) => deliver(event.data, handlers)
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
