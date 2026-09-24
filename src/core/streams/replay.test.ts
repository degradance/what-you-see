import { describe, expect, it } from 'vitest'
import { ReplayCursor, type Recording } from './replay'

const recording: Recording = {
  durationMs: 100,
  events: [
    { at: 0, data: 'a' },
    { at: 40, data: 'b' },
    { at: 90, data: 'c' },
  ],
}

function run(cursor: ReplayCursor, ms: number): string[] {
  const out: string[] = []
  cursor.advance(ms, (data) => out.push(data))
  return out
}

describe('ReplayCursor', () => {
  it('emits the messages it passes, each once', () => {
    const cursor = new ReplayCursor(recording)
    expect(run(cursor, 10)).toEqual(['a'])
    expect(run(cursor, 30)).toEqual(['b'])
    expect(run(cursor, 20)).toEqual([])
  })

  it('loops at the end of the recording', () => {
    const cursor = new ReplayCursor(recording)
    expect(run(cursor, 95)).toEqual(['a', 'b', 'c'])
    expect(run(cursor, 10)).toEqual(['a'])
  })

  it('plays several loops in one step at a high rate', () => {
    const cursor = new ReplayCursor(recording)
    expect(run(cursor, 250)).toEqual(['a', 'b', 'c', 'a', 'b', 'c', 'a', 'b'])
  })

  it('does nothing with an empty recording', () => {
    expect(run(new ReplayCursor({ durationMs: 100, events: [] }), 500)).toEqual([])
  })
})
