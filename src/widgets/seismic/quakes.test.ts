import { describe, expect, it } from 'vitest'
import { formatAgo, isRecent, markerRadius, RECENT_MS } from './quakes'

describe('markerRadius', () => {
  it('grows with magnitude and never vanishes', () => {
    expect(markerRadius(6)).toBeGreaterThan(markerRadius(3))
    expect(markerRadius(0.2)).toBeGreaterThanOrEqual(1.5)
  })
})

describe('isRecent', () => {
  it('treats the last hour as recent', () => {
    expect(isRecent(1_000_000 - RECENT_MS + 1, 1_000_000)).toBe(true)
    expect(isRecent(1_000_000 - RECENT_MS, 1_000_000)).toBe(false)
  })
})

describe('formatAgo', () => {
  const now = 10_000_000
  it.each([
    [now - 5_000, 'now'],
    [now - 61_000, '1 min'],
    [now - 59 * 60_000, '59 min'],
    [now - 60 * 60_000, '1 h'],
    [now - 5 * 3_600_000 - 1_000, '5 h'],
    [now + 30_000, 'now'],
  ])('formats %d as "%s"', (time, expected) => {
    expect(formatAgo(time, now)).toBe(expected)
  })
})
