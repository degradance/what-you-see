import { describe, expect, it } from 'vitest'
import { parseQuakes } from './schema'

const feature = (over: Record<string, unknown> = {}, props: Record<string, unknown> = {}) => ({
  type: 'Feature',
  id: 'us7000abcd',
  properties: { mag: 4.6, place: '10 km S of Somewhere', time: 1_789_928_379_588, type: 'earthquake', ...props },
  geometry: { type: 'Point', coordinates: [-139.373, 58.464, 10.1] },
  ...over,
})

describe('parseQuakes', () => {
  it('maps a feature to a flat quake', () => {
    expect(parseQuakes({ features: [feature()] })).toEqual([
      {
        id: 'us7000abcd',
        mag: 4.6,
        place: '10 km S of Somewhere',
        time: 1_789_928_379_588,
        lon: -139.373,
        lat: 58.464,
      },
    ])
  })

  it('drops bad features and keeps the good ones', () => {
    const result = parseQuakes({
      features: [
        feature({ id: 'a' }),
        feature({ id: 'b' }, { mag: null }),
        feature({ id: 'c' }, { type: 'quarry blast' }),
        feature({ id: 'd', geometry: { type: 'Point', coordinates: [200, 0, 1] } }),
        feature({ id: 'e', geometry: null }),
        'garbage',
        feature({ id: 'f' }),
      ],
    })
    expect(result?.map((q) => q.id)).toEqual(['a', 'f'])
  })

  it('falls back to a placeholder when the place is missing', () => {
    expect(parseQuakes({ features: [feature({}, { place: null })] })?.[0]?.place).toBe('Unnamed region')
  })

  it('accepts a feed with no features', () => {
    expect(parseQuakes({ features: [] })).toEqual([])
  })

  it.each([null, 'text', 42, {}, { features: 'nope' }])('rejects a payload of the wrong shape: %j', (payload) => {
    expect(parseQuakes(payload)).toBeNull()
  })
})
