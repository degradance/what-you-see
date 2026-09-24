import { describe, expect, it } from 'vitest'
import { toRecording, type RecordedStream } from './recording'
import { parseChange } from './schema'

const stream: RecordedStream = {
  durationMs: 1000,
  domains: ['en.wikipedia.org', 'www.wikidata.org'],
  events: [
    [0, 0, 0, 0, 1200, 'Tour Eiffel'],
    [10, 1, 1, 1, 900, 'Q42'],
    [20, 0, 2, 0, 600, ''],
  ],
}

describe('toRecording', () => {
  const { events } = toRecording(stream)

  it('keeps the timing', () => {
    expect(events.map((e) => e.at)).toEqual([0, 10, 20])
  })

  it('pads every message to its recorded size', () => {
    expect(events.map((e) => e.data.length)).toEqual([1200, 900, 600])
  })

  it('produces messages the widget parses, and rejects the kinds it drops', () => {
    expect(parseChange(events[0]!.data)).toMatchObject({ type: 'edit', title: 'Tour Eiffel', bot: false, meta: { domain: 'en.wikipedia.org' } })
    expect(parseChange(events[1]!.data)).toMatchObject({ type: 'new', bot: true, meta: { domain: 'www.wikidata.org' } })
    expect(parseChange(events[2]!.data)).toBeNull()
  })
})
