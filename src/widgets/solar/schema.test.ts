import { describe, expect, it } from 'vitest'
import { parseKp } from './schema'

const row = (over: Record<string, unknown> = {}) => ({
  time_tag: '2026-09-13T00:00:00',
  Kp: 2.33,
  a_running: 9,
  station_count: 8,
  ...over,
})

describe('parseKp', () => {
  it('reads the time tag as UTC', () => {
    expect(parseKp([row()])).toEqual([{ time: Date.UTC(2026, 8, 13), kp: 2.33 }])
  })

  it('sorts the readings by time', () => {
    const samples = parseKp([row({ time_tag: '2026-09-13T06:00:00' }), row(), row({ time_tag: '2026-09-13T03:00:00' })])
    expect(samples?.map((s) => s.time)).toEqual([0, 3, 6].map((h) => Date.UTC(2026, 8, 13, h)))
  })

  it('keeps the good rows and drops the bad ones', () => {
    const samples = parseKp([
      row(),
      row({ Kp: 12 }),
      row({ Kp: '3.00' }),
      row({ time_tag: '2026-09-13' }),
      row({ time_tag: '2026-13-45T00:00:00' }),
      null,
      row({ time_tag: '2026-09-13T03:00:00', Kp: 0 }),
    ])
    expect(samples?.map((s) => s.kp)).toEqual([2.33, 0])
  })

  it.each([null, 'text', {}, [], [{ nope: true }], [row({ Kp: -1 })]])('rejects a payload with no usable row: %j', (payload) => {
    expect(parseKp(payload)).toBeNull()
  })
})
