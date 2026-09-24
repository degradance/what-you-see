import { describe, expect, it, vi } from 'vitest'
import { onPipelineMode, onReplayRate, pipelineMode, replayRate, setPipelineMode, setReplayRate } from './load'

describe('replay rate', () => {
  it('starts on the live stream and notifies on change only', () => {
    expect(replayRate()).toBe(0)
    const listener = vi.fn()
    const off = onReplayRate(listener)
    setReplayRate(10)
    setReplayRate(10)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(10)
    off()
    setReplayRate(0)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(replayRate()).toBe(0)
  })

  it('keeps the pipeline mode apart from the rate', () => {
    const listener = vi.fn()
    onPipelineMode(listener)
    setPipelineMode('worker')
    expect(pipelineMode()).toBe('worker')
    expect(replayRate()).toBe(0)
    expect(listener).toHaveBeenCalledWith('worker')
    setPipelineMode('main')
  })
})
