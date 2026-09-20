import * as v from 'valibot'

const PositionSchema = v.object({
  latitude: v.pipe(v.number(), v.minValue(-90), v.maxValue(90)),
  longitude: v.pipe(v.number(), v.minValue(-180), v.maxValue(180)),
  altitude: v.number(),
  velocity: v.number(),
  // Diameter of the patch of Earth in view, in kilometres.
  footprint: v.number(),
  visibility: v.string(),
  timestamp: v.number(),
})

export interface Position {
  lat: number
  lon: number
  altitudeKm: number
  speedKmh: number
  footprintKm: number
  visibility: string
  // Milliseconds since the epoch; the API reports seconds.
  time: number
}

function toPosition(raw: unknown): Position | null {
  const result = v.safeParse(PositionSchema, raw)
  if (!result.success) return null
  const p = result.output
  return {
    lat: p.latitude,
    lon: p.longitude,
    altitudeKm: p.altitude,
    speedKmh: p.velocity,
    footprintKm: p.footprint,
    visibility: p.visibility,
    time: p.timestamp * 1000,
  }
}

export const parsePosition = (json: unknown): Position | null => toPosition(json)

// A history request returns an array; one malformed entry must not cost the whole trail.
export function parsePositions(json: unknown): Position[] | null {
  if (!Array.isArray(json)) return null
  return json.flatMap((entry) => toPosition(entry) ?? [])
}
