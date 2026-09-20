import type { StreamStatus } from './sse'

export const STATUS_LABEL: Record<StreamStatus, string> = {
  connecting: 'Connecting',
  live: 'Live',
  reconnecting: 'Signal lost',
  paused: 'Paused · tab hidden',
}

export const STATUS_TONE: Record<StreamStatus, string> = {
  connecting: 'text-warn',
  live: 'text-live',
  reconnecting: 'text-signal',
  paused: 'text-muted',
}
