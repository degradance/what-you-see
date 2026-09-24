import { describe, expect, it } from 'vitest'
import { StreamMeter } from './stream'

describe('StreamMeter', () => {
  it('sums events and time, then starts over', () => {
    const meter = new StreamMeter()
    meter.record(0.5)
    meter.record(0.25)
    expect(meter.take()).toEqual({ events: 2, ms: 0.75 })
    expect(meter.take()).toEqual({ events: 0, ms: 0 })
  })
})
