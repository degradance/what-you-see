import * as v from 'valibot'

// Features are validated one by one so a single malformed record does not blank the whole globe.
// Non-earthquake events (quarry blasts, explosions) and quakes without a magnitude fail here on purpose.
const FeatureSchema = v.object({
  id: v.string(),
  properties: v.object({
    mag: v.number(),
    place: v.nullable(v.string()),
    time: v.number(),
    type: v.literal('earthquake'),
  }),
  geometry: v.object({
    coordinates: v.tupleWithRest(
      [
        v.pipe(v.number(), v.minValue(-180), v.maxValue(180)),
        v.pipe(v.number(), v.minValue(-90), v.maxValue(90)),
      ],
      v.number(),
    ),
  }),
})

const CollectionSchema = v.object({ features: v.array(v.unknown()) })

export interface Quake {
  id: string
  mag: number
  place: string
  time: number
  lon: number
  lat: number
}

export function parseQuakes(json: unknown): Quake[] | null {
  const collection = v.safeParse(CollectionSchema, json)
  if (!collection.success) return null

  const quakes: Quake[] = []
  for (const raw of collection.output.features) {
    const result = v.safeParse(FeatureSchema, raw)
    if (!result.success) continue
    const { id, properties, geometry } = result.output
    const [lon, lat] = geometry.coordinates
    quakes.push({
      id,
      mag: properties.mag,
      place: properties.place ?? 'Unnamed region',
      time: properties.time,
      lon,
      lat,
    })
  }
  return quakes
}
