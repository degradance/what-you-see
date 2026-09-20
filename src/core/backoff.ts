export interface BackoffOptions {
  base?: number
  max?: number
  random?: () => number
}

// "Equal jitter": half of the delay is fixed, half is random, so clients neither retry instantly nor in lockstep.
export function nextDelay(
  attempt: number,
  { base = 1_000, max = 30_000, random = Math.random }: BackoffOptions = {},
): number {
  const ceiling = Math.min(max, base * 2 ** attempt)
  return Math.round(ceiling / 2 + (random() * ceiling) / 2)
}
