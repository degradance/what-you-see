import type { Recording } from '@/core/streams/replay'

// The shape `scripts/record-wikimedia.mjs` writes: [ms, domain index, kind, bot, message bytes, title].
export interface RecordedStream {
  durationMs: number
  domains: string[]
  events: [number, number, number, number, number, string][]
}

const TYPES = ['edit', 'new', 'log'] as const

// Rebuilds each message at its original size. The filler stands in for the fields the recording leaves out
// (comments, revision ids, URLs), so JSON.parse costs what it costs on the live stream.
export function toRecording({ durationMs, domains, events }: RecordedStream): Recording {
  return {
    durationMs,
    events: events.map(([at, domain, kind, bot, bytes, title], i) => {
      const message = { type: TYPES[kind] ?? 'log', title, bot: bot === 1, meta: { id: `replay-${i}`, domain: domains[domain] ?? '' } }
      const base = JSON.stringify({ ...message, comment: '' })
      const data = JSON.stringify({ ...message, comment: 'x'.repeat(Math.max(0, bytes - base.length)) })
      return { at, data }
    }),
  }
}
