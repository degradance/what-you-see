import * as v from 'valibot'

// NOAA writes UTC without a zone suffix; the shape is checked so that the suffix can be added safely.
const TIME_TAG = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/

const RowSchema = v.object({
  time_tag: v.pipe(v.string(), v.regex(TIME_TAG)),
  Kp: v.pipe(v.number(), v.minValue(0), v.maxValue(9)),
})

export interface KpSample {
  // Start of the three-hour interval, milliseconds since the epoch.
  time: number
  kp: number
}

function toSample(raw: unknown): KpSample | null {
  const result = v.safeParse(RowSchema, raw)
  if (!result.success) return null
  // Without the `Z`, `Date.parse` would read the tag as local time and shift the whole chart by the viewer's offset.
  const time = Date.parse(`${result.output.time_tag}Z`)
  return Number.isNaN(time) ? null : { time, kp: result.output.Kp }
}

// One malformed row must not cost the chart; a payload with no usable row at all is rejected, so `poll` backs off.
export function parseKp(json: unknown): KpSample[] | null {
  if (!Array.isArray(json)) return null
  const samples = json.flatMap((row) => toSample(row) ?? []).sort((a, b) => a.time - b.time)
  return samples.length > 0 ? samples : null
}
