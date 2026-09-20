import { describe, expect, it } from 'vitest'
import type { Position } from './schema'
import { chunkTrack, footprintRadiusDeg, historyTimestamps, mergeTrack } from './track'

const at = (time: number, lon = 0): Position => ({
  lat: 0,
  lon,
  altitudeKm: 420,
  speedKmh: 27_000,
  footprintKm: 4500,
  visibility: 'daylight',
  time,
})

describe('mergeTrack', () => {
  it('sorts by time and drops duplicates, preferring the newer copy', () => {
    const merged = mergeTrack([at(3000, 3), at(1000, 1)], [at(2000, 2), at(3000, 33)], 4000, 10_000)
    expect(merged.map((p) => [p.time, p.lon])).toEqual([
      [1000, 1],
      [2000, 2],
      [3000, 33],
    ])
  })

  it('drops points older than the window', () => {
    const merged = mergeTrack([at(1000)], [at(9000)], 10_000, 5000)
    expect(merged.map((p) => p.time)).toEqual([9000])
  })
})

describe('chunkTrack', () => {
  it('returns nothing for fewer than two points', () => {
    expect(chunkTrack([], 4)).toEqual([])
    expect(chunkTrack([at(1)], 4)).toEqual([])
  })

  it('covers every segment once and joins neighbouring chunks at a shared point', () => {
    const track = Array.from({ length: 11 }, (_, i) => at(i, i))
    const chunks = chunkTrack(track, 5)
    expect(chunks.length).toBeLessThanOrEqual(5)
    expect(chunks.flatMap((c) => c.length - 1).reduce((a, b) => a + b, 0)).toBe(10)
    for (let i = 1; i < chunks.length; i++) {
      expect(chunks[i]![0]).toEqual(chunks[i - 1]!.at(-1))
    }
  })

  it('keeps a two-point track as a single chunk', () => {
    expect(chunkTrack([at(1, 1), at(2, 2)], 5)).toEqual([
      [
        [1, 0],
        [2, 0],
      ],
    ])
  })
})

describe('footprintRadiusDeg', () => {
  it('turns a 4584 km diameter into about 20.6 degrees', () => {
    expect(footprintRadiusDeg(4584)).toBeCloseTo(20.6, 1)
  })
})

describe('historyTimestamps', () => {
  it('returns ascending timestamps in seconds ending one step before now', () => {
    expect(historyTimestamps(1_000_000_000, 3, 120)).toEqual([999_640, 999_760, 999_880])
  })
})
