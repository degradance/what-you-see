export const RECENT_MS = 60 * 60_000

export const isRecent = (time: number, now: number) => now - time < RECENT_MS

// Magnitude is logarithmic, so a linear radius already understates the difference between M3 and M6.
export const markerRadius = (mag: number) => Math.max(1.5, 1.5 + (mag - 2) * 1.2)

export function formatAgo(time: number, now: number): string {
  const minutes = Math.floor(Math.max(0, now - time) / 60_000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h`
}
