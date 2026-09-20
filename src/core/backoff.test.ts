import { describe, expect, it } from 'vitest'
import { nextDelay } from './backoff'

describe('nextDelay', () => {
  it('stays between half and the full exponential ceiling', () => {
    expect(nextDelay(0, { random: () => 0 })).toBe(500)
    expect(nextDelay(0, { random: () => 1 })).toBe(1_000)
    expect(nextDelay(3, { random: () => 0 })).toBe(4_000)
    expect(nextDelay(3, { random: () => 1 })).toBe(8_000)
  })

  it('never exceeds the max', () => {
    expect(nextDelay(50, { random: () => 1 })).toBe(30_000)
    expect(nextDelay(50, { random: () => 1, max: 5_000 })).toBe(5_000)
  })
})
