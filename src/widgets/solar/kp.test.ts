import { describe, expect, it } from 'vitest'
import { formatKp, formatWhen, kpLevel, layoutChart, summarize } from './kp'
import type { KpSample } from './schema'

const H = 3_600_000
const start = Date.UTC(2026, 8, 13)
const at = (hours: number, kp: number): KpSample => ({ time: start + hours * H, kp })

describe('kpLevel', () => {
  it.each([
    [0, 'quiet'],
    [3.67, 'quiet'],
    [4, 'active'],
    [4.67, 'active'],
    [5, 'storm'],
    [8.33, 'storm'],
  ] as const)('Kp %f is %s', (kp, level) => {
    expect(kpLevel(kp)).toBe(level)
  })
})

describe('formatting', () => {
  it('keeps two decimals', () => {
    expect(formatKp(3)).toBe('3.00')
    expect(formatKp(0.67)).toBe('0.67')
  })

  it('names the UTC weekday and time, whatever the local timezone is', () => {
    expect(formatWhen(Date.UTC(2026, 8, 15, 9))).toBe('Tue 09:00 UTC')
  })
})

describe('layoutChart', () => {
  it('has nothing to draw without samples', () => {
    expect(layoutChart([])).toBeNull()
  })

  it('scales Kp 0–9 to the full height and puts the storm line at Kp 5', () => {
    const chart = layoutChart([at(0, 9), at(3, 2)])!
    expect(chart.height).toBe(90)
    expect(chart.stormY).toBe(40)
    expect(chart.bars[0]).toMatchObject({ y: 0, height: 90, level: 'storm' })
    expect(chart.bars[1]).toMatchObject({ y: 70, height: 20, level: 'quiet' })
  })

  it('gives a zero reading a hairline instead of nothing', () => {
    expect(layoutChart([at(0, 0)])!.bars[0]!.height).toBeGreaterThan(0)
  })

  it('places bars by time and leaves a gap for a missing interval', () => {
    const chart = layoutChart([at(0, 1), at(3, 1), at(12, 1)])!
    expect(chart.bars.map((b) => b.x)).toEqual([0, 10, 40])
    // The chart ends with the last bar, not with the gap after it.
    expect(chart.width).toBe(48)
  })

  it('puts a tick at each UTC midnight and none too close to the right edge', () => {
    const samples = Array.from({ length: 25 }, (_, i) => at(i * 3, 1))
    const { ticks } = layoutChart(samples)!
    // Slots 0, 8, 16 and 24 are midnights; the last one sits on the right edge, where its label would not fit.
    expect(ticks.map((t) => t.label)).toEqual(['Sun', 'Mon', 'Tue'])
    expect(ticks[0]!.fraction).toBe(0)
    expect(ticks[1]!.fraction).toBeCloseTo(80 / 248, 5)
  })
})

describe('summarize', () => {
  it('has nothing to say without samples', () => {
    expect(summarize([])).toBeNull()
  })

  it('reports the latest reading, the peak and the number of storm readings', () => {
    const result = summarize([at(0, 5.33), at(3, 6), at(6, 2), at(9, 1)])!
    expect(result.latest.kp).toBe(1)
    expect(result.peak.kp).toBe(6)
    expect(result.stormReadings).toBe(2)
  })

  it('prefers the most recent reading on a tie for the peak', () => {
    expect(summarize([at(0, 3), at(3, 3), at(6, 1)])!.peak.time).toBe(at(3, 3).time)
  })
})
