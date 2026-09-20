import { geoCircle, type GeoPermissibleObjects } from 'd3-geo'

// A small circle on the sphere, e.g. what a satellite can see. d3 handles the horizon and the antimeridian when it is drawn.
export function circle(lon: number, lat: number, radiusDeg: number): GeoPermissibleObjects {
  return geoCircle().center([lon, lat]).radius(radiusDeg)()
}
