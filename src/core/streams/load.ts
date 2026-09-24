// The visitor's load controls, shared between the panel that sets them and the widgets that follow them.

function setting<T>(initial: T) {
  let current = initial
  const listeners = new Set<(value: T) => void>()
  return {
    get: (): T => current,
    set(value: T): void {
      if (value === current) return
      current = value
      listeners.forEach((listener) => listener(value))
    },
    on(listener: (value: T) => void): () => void {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

// 0 is the live stream; any other value replays a recording at that multiple of real time.
export const REPLAY_RATES = [0, 1, 10, 100, 1000] as const
export type ReplayRate = (typeof REPLAY_RATES)[number]

const rate = setting<ReplayRate>(0)
export const replayRate = rate.get
export const setReplayRate = rate.set
export const onReplayRate = rate.on

// How a stream reaches the page. `naive` updates reactive state on every message, the way a first version would;
// `main` batches that into a flush four times a second; `worker` also moves parsing off the main thread.
export const PIPELINE_MODES = ['naive', 'main', 'worker'] as const
export type PipelineMode = (typeof PIPELINE_MODES)[number]

const mode = setting<PipelineMode>('main')
export const pipelineMode = mode.get
export const setPipelineMode = mode.set
export const onPipelineMode = mode.on
