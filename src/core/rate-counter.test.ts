import { describe, expect, it } from 'vitest'
import { RateCounter } from './rate-counter'

const T0 = 1_700_000_000_000

describe('RateCounter', () => {
  it('is zero before anything happened', () => {
    expect(new RateCounter(10).perSecond(T0)).toBe(0)
  })

  it('averages over the seconds seen so far while the window is still filling', () => {
    const rate = new RateCounter(10)
    for (let i = 0; i < 6; i++) rate.add(T0)
    for (let i = 0; i < 4; i++) rate.add(T0 + 1_000)
    expect(rate.perSecond(T0 + 2_000)).toBe(5)
  })

  it('ignores the current partial second', () => {
    const rate = new RateCounter(10)
    rate.add(T0)
    rate.add(T0 + 1_000)
    rate.add(T0 + 1_000)
    expect(rate.perSecond(T0 + 1_500)).toBe(1)
  })

  it('forgets events that left the window', () => {
    const rate = new RateCounter(5)
    for (let i = 0; i < 5; i++) rate.add(T0 + i * 1_000)
    expect(rate.perSecond(T0 + 5_000)).toBe(1)
    expect(rate.perSecond(T0 + 30_000)).toBe(0)
  })

  it('reuses a bucket cleanly after the window wraps', () => {
    const rate = new RateCounter(3)
    rate.add(T0)
    rate.add(T0 + 3_000)
    rate.add(T0 + 3_000)
    expect(rate.perSecond(T0 + 4_000)).toBeCloseTo(2 / 3)
  })
})
