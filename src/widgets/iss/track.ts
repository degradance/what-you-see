import type { Position } from './schema'

// Merges new positions into an ascending, duplicate-free track and drops what is older than the window.
export function mergeTrack(
  track: readonly Position[],
  incoming: readonly Position[],
  now: number,
  windowMs: number,
): Position[] {
  const byTime = new Map<number, Position>()
  for (const p of track) byTime.set(p.time, p)
  for (const p of incoming) byTime.set(p.time, p)
  return [...byTime.values()].filter((p) => now - p.time <= windowMs).sort((a, b) => a.time - b.time)
}

// Oldest chunk first, each sharing its end point with the next so the line has no gaps; the caller fades them by index.
export function chunkTrack(track: readonly Position[], chunks: number): [number, number][][] {
  if (track.length < 2) return []
  const coords = track.map((p): [number, number] => [p.lon, p.lat])
  const size = Math.ceil((coords.length - 1) / chunks)
  const out: [number, number][][] = []
  for (let start = 0; start < coords.length - 1; start += size) {
    out.push(coords.slice(start, start + size + 1))
  }
  return out
}

// The API gives the footprint as a diameter in kilometres; the globe wants an angular radius.
export const EARTH_RADIUS_KM = 6371
export const footprintRadiusDeg = (footprintKm: number) =>
  (footprintKm / 2 / EARTH_RADIUS_KM) * (180 / Math.PI)

// Timestamps in seconds for a history request, ascending; the newest is one step before now because the live poll covers now.
export function historyTimestamps(nowMs: number, count: number, stepS: number): number[] {
  const nowS = Math.floor(nowMs / 1000)
  return Array.from({ length: count }, (_, i) => nowS - (count - i) * stepS)
}
