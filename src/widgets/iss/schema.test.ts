import { describe, expect, it } from 'vitest'
import { parsePosition, parsePositions } from './schema'

const raw = (over: Record<string, unknown> = {}) => ({
  name: 'iss',
  id: 25544,
  latitude: -41.5,
  longitude: -136.7,
  altitude: 435.2,
  velocity: 27536.6,
  footprint: 4584,
  visibility: 'daylight',
  timestamp: 1_789_929_560,
  units: 'kilometers',
  ...over,
})

describe('parsePosition', () => {
  it('maps the payload and converts seconds to milliseconds', () => {
    expect(parsePosition(raw())).toEqual({
      lat: -41.5,
      lon: -136.7,
      altitudeKm: 435.2,
      speedKmh: 27536.6,
      footprintKm: 4584,
      visibility: 'daylight',
      time: 1_789_929_560_000,
    })
  })

  it.each([
    null,
    'text',
    {},
    raw({ latitude: 91 }),
    raw({ longitude: 'west' }),
    raw({ timestamp: undefined }),
  ])('rejects a bad payload: %j', (payload) => {
    expect(parsePosition(payload)).toBeNull()
  })
})

describe('parsePositions', () => {
  it('keeps the good entries of a history response', () => {
    const result = parsePositions([raw({ timestamp: 1 }), { nope: true }, raw({ timestamp: 2 })])
    expect(result?.map((p) => p.time)).toEqual([1000, 2000])
  })

  it('rejects a response that is not a list', () => {
    expect(parsePositions(raw())).toBeNull()
  })
})
