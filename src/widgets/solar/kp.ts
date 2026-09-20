import type { KpSample } from './schema'

export const SLOT_MS = 3 * 3_600_000
const DAY_MS = 24 * 3_600_000

export type KpLevel = 'quiet' | 'active' | 'storm'

// NOAA calls Kp 5 a minor (G1) storm; Kp 4 is "active" but not yet a storm.
export const STORM_KP = 5
const ACTIVE_KP = 4

export const kpLevel = (kp: number): KpLevel => (kp >= STORM_KP ? 'storm' : kp >= ACTIVE_KP ? 'active' : 'quiet')

export const formatKp = (kp: number) => kp.toFixed(2)

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const pad = (n: number) => String(n).padStart(2, '0')

// UTC on purpose: the index is global, and a chart that changes with the viewer's timezone cannot be compared.
export function formatWhen(time: number): string {
  const d = new Date(time)
  return `${WEEKDAYS[d.getUTCDay()]} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
}

// One slot is 10 units wide with an 8 unit bar, and one Kp step is 10 units tall, so the scale 0–9 fills the height.
const SLOT_W = 10
const BAR_W = 8
const KP_MAX = 9
const UNIT = 10
// A reading of exactly 0 still gets a hairline, otherwise it looks like a missing interval.
const MIN_BAR = 1
// A label that starts near the right edge would run out of the chart.
const LAST_TICK_FRACTION = 0.9

export interface Bar {
  x: number
  y: number
  width: number
  height: number
  level: KpLevel
  sample: KpSample
}

export interface Tick {
  // Position along the chart, 0–1.
  fraction: number
  label: string
}

export interface Chart {
  width: number
  height: number
  stormY: number
  bars: Bar[]
  ticks: Tick[]
}

// A bar sits by its time, not by its index, so a missing interval leaves a gap instead of squeezing the rest together.
export function layoutChart(samples: readonly KpSample[]): Chart | null {
  const first = samples[0]
  const last = samples.at(-1)
  if (!first || !last) return null

  const slotOf = (time: number) => (time - first.time) / SLOT_MS
  const height = KP_MAX * UNIT
  const width = (Math.round(slotOf(last.time)) + 1) * SLOT_W - (SLOT_W - BAR_W)

  const bars = samples.map((sample) => {
    const barHeight = Math.max(MIN_BAR, sample.kp * UNIT)
    return {
      x: Math.round(slotOf(sample.time)) * SLOT_W,
      y: height - barHeight,
      width: BAR_W,
      height: barHeight,
      level: kpLevel(sample.kp),
      sample,
    }
  })

  const ticks: Tick[] = []
  for (let midnight = Math.ceil(first.time / DAY_MS) * DAY_MS; midnight <= last.time; midnight += DAY_MS) {
    const fraction = (slotOf(midnight) * SLOT_W) / width
    if (fraction <= LAST_TICK_FRACTION) ticks.push({ fraction, label: WEEKDAYS[new Date(midnight).getUTCDay()]! })
  }

  return { width, height, stormY: height - STORM_KP * UNIT, bars, ticks }
}

export interface Summary {
  latest: KpSample
  // On a tie the most recent reading wins.
  peak: KpSample
  stormReadings: number
}

export function summarize(samples: readonly KpSample[]): Summary | null {
  const latest = samples.at(-1)
  if (!latest) return null
  let peak = latest
  let stormReadings = 0
  for (const sample of samples) {
    if (sample.kp >= peak.kp) peak = sample
    if (sample.kp >= STORM_KP) stormReadings++
  }
  return { latest, peak, stormReadings }
}
