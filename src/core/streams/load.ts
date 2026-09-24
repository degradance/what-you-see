// The visitor's load control, shared between the panel that sets it and the widgets that follow it.
// 0 is the live stream; any other value replays a recording at that multiple of real time.
export const REPLAY_RATES = [0, 1, 10, 100] as const
export type ReplayRate = (typeof REPLAY_RATES)[number]

let current: ReplayRate = 0
const listeners = new Set<(rate: ReplayRate) => void>()

export const replayRate = (): ReplayRate => current

export function setReplayRate(rate: ReplayRate): void {
  if (rate === current) return
  current = rate
  listeners.forEach((listener) => listener(rate))
}

export function onReplayRate(listener: (rate: ReplayRate) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
