import { describe, expect, it } from 'vitest'
import { StreamMeter } from './stream'

describe('StreamMeter', () => {
  it('sums events and time, then starts over', () => {
    const meter = new StreamMeter()
    meter.record(0.5)
    meter.record(0.25)
    expect(meter.take()).toEqual({ events: 2, ms: 0.75, offThreadMs: 0 })
    expect(meter.take()).toEqual({ events: 0, ms: 0, offThreadMs: 0 })
  })

  it('keeps work reported by a worker apart from main-thread time', () => {
    const meter = new StreamMeter()
    meter.record(1)
    meter.addOffThread(100, 20)
    expect(meter.take()).toEqual({ events: 101, ms: 1, offThreadMs: 20 })
  })
})
