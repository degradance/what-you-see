// Signed angle in degrees from `from` to `to`, taking the short way round the sphere.
export function shortestDelta(from: number, to: number): number {
  return ((((to - from) % 360) + 540) % 360) - 180
}

// Frame-rate independent smoothing: after `halfLifeMs` the distance to the target has halved, whatever the frame time.
export function easeFactor(dtMs: number, halfLifeMs: number): number {
  return 1 - 2 ** (-dtMs / halfLifeMs)
}

export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
