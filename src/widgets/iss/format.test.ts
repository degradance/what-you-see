import { describe, expect, it } from 'vitest'
import { formatKm, formatLat, formatLon } from './format'

describe('format', () => {
  it('adds the hemisphere instead of a minus sign', () => {
    expect(formatLat(-41.531)).toBe('41.53° S')
    expect(formatLat(51.6)).toBe('51.60° N')
    expect(formatLon(-136.716)).toBe('136.72° W')
    expect(formatLon(10)).toBe('10.00° E')
  })

  it('groups thousands of kilometres', () => {
    expect(formatKm(27536.59)).toBe('27,537')
    expect(formatKm(435.2)).toBe('435')
  })
})
