import { describe, expect, it, vi } from 'vitest'
import { onReplayRate, replayRate, setReplayRate } from './load'

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
})
