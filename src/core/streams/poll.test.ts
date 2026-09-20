import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { poll } from './poll'
import type { StreamStatus } from './sse'

const json = (body: unknown, ok = true) =>
  Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response)

// A request that only settles when it is aborted, like a hung connection.
const hanging = (_url: unknown, init?: RequestInit) =>
  new Promise<Response>((_, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
  })

const flush = () => vi.advanceTimersByTimeAsync(0)

describe('poll', () => {
  let listeners: Map<string, () => void>
  let doc: { hidden: boolean }

  const setHidden = (hidden: boolean) => {
    doc.hidden = hidden
    listeners.get('visibilitychange')?.()
  }

  beforeEach(() => {
    vi.useFakeTimers()
    // Zero jitter makes the first backoff step exactly half of the base delay.
    vi.spyOn(Math, 'random').mockReturnValue(0)
    listeners = new Map()
    doc = { hidden: false }
    vi.stubGlobal('document', {
      get hidden() {
        return doc.hidden
      },
      addEventListener: (type: string, fn: () => void) => listeners.set(type, fn),
      removeEventListener: (type: string) => listeners.delete(type),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('delivers parsed data and polls again after the interval', async () => {
    const fetchFn = vi.fn(() => json({ n: 1 }))
    const onData = vi.fn()
    const statuses: StreamStatus[] = []
    const dispose = poll({
      url: 'u',
      intervalMs: 60_000,
      parse: (j) => (j as { n: number }).n,
      onData,
      onStatus: (s) => statuses.push(s),
      fetchFn,
    })

    await flush()
    expect(onData).toHaveBeenCalledWith(1)
    expect(statuses).toEqual(['connecting', 'live'])

    await vi.advanceTimersByTimeAsync(59_999)
    expect(fetchFn).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(fetchFn).toHaveBeenCalledTimes(2)
    dispose()
  })

  it('backs off on an HTTP error and recovers', async () => {
    const fetchFn = vi
      .fn()
      .mockImplementationOnce(() => json(null, false))
      .mockImplementation(() => json({ n: 2 }))
    const onData = vi.fn()
    const statuses: StreamStatus[] = []
    const dispose = poll({
      url: 'u',
      intervalMs: 60_000,
      parse: (j) => (j as { n: number }).n,
      onData,
      onStatus: (s) => statuses.push(s),
      fetchFn,
    })

    await flush()
    expect(statuses).toEqual(['connecting', 'reconnecting'])
    expect(onData).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(500)
    expect(onData).toHaveBeenCalledWith(2)
    expect(statuses.at(-1)).toBe('live')
    dispose()
  })

  it('treats a payload the parser rejects as a failed attempt', async () => {
    const onData = vi.fn()
    const statuses: StreamStatus[] = []
    const dispose = poll({
      url: 'u',
      intervalMs: 60_000,
      parse: () => null,
      onData,
      onStatus: (s) => statuses.push(s),
      fetchFn: () => json({ unexpected: true }),
    })

    await flush()
    expect(onData).not.toHaveBeenCalled()
    expect(statuses).toEqual(['connecting', 'reconnecting'])
    dispose()
  })

  it('treats a network error as a failed attempt instead of throwing', async () => {
    const statuses: StreamStatus[] = []
    const dispose = poll({
      url: 'u',
      intervalMs: 60_000,
      parse: (j) => j,
      onData: vi.fn(),
      onStatus: (s) => statuses.push(s),
      fetchFn: () => Promise.reject(new TypeError('offline')),
    })

    await flush()
    expect(statuses).toEqual(['connecting', 'reconnecting'])
    dispose()
  })

  it('aborts the in-flight request when the tab is hidden and polls at once when it returns', async () => {
    const fetchFn = vi.fn(hanging)
    const statuses: StreamStatus[] = []
    const dispose = poll({
      url: 'u',
      intervalMs: 60_000,
      parse: (j) => j,
      onData: vi.fn(),
      onStatus: (s) => statuses.push(s),
      fetchFn,
    })

    await flush()
    const firstSignal = (fetchFn.mock.calls[0]?.[1] as RequestInit).signal
    setHidden(true)
    expect(firstSignal?.aborted).toBe(true)
    expect(statuses.at(-1)).toBe('paused')

    await vi.advanceTimersByTimeAsync(120_000)
    expect(fetchFn).toHaveBeenCalledTimes(1)

    setHidden(false)
    expect(fetchFn).toHaveBeenCalledTimes(2)
    dispose()
  })

  it('does not fetch while the tab is hidden at start', async () => {
    doc.hidden = true
    const fetchFn = vi.fn(() => json(1))
    const statuses: StreamStatus[] = []
    const dispose = poll({
      url: 'u',
      intervalMs: 1_000,
      parse: (j) => j,
      onData: vi.fn(),
      onStatus: (s) => statuses.push(s),
      fetchFn,
    })

    await vi.advanceTimersByTimeAsync(5_000)
    expect(fetchFn).not.toHaveBeenCalled()
    expect(statuses).toEqual(['paused'])
    dispose()
  })

  it('stops for good once disposed', async () => {
    const fetchFn = vi.fn(() => json(1))
    const dispose = poll({
      url: 'u',
      intervalMs: 1_000,
      parse: (j) => j,
      onData: vi.fn(),
      fetchFn,
    })

    await flush()
    dispose()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(listeners.size).toBe(0)
  })
})
