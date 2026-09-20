import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import atlas from './land.json'

// Land only, at 1:110m and re-quantized by `scripts/build-land.mjs`: borders would never be readable at card size.
const topology = atlas as unknown as Topology<{ land: GeometryCollection }>

export const land = feature(topology, topology.objects.land)
