import { describe, expect, it, vi } from 'vitest'
import { fetchParsed } from './fetch-json'

const respond = (body: unknown, ok = true) =>
  vi.fn(() => Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response))

describe('fetchParsed', () => {
  it('returns the parsed payload', async () => {
    expect(await fetchParsed('u', (j) => (j as { n: number }).n, { fetchFn: respond({ n: 3 }) })).toBe(3)
  })

  it('passes the abort signal to fetch', async () => {
    const fetchFn = respond({})
    const { signal } = new AbortController()
    await fetchParsed('u', (j) => j, { signal, fetchFn })
    expect(fetchFn).toHaveBeenCalledWith('u', { signal })
  })

  it('returns null for a bad status', async () => {
    expect(await fetchParsed('u', (j) => j, { fetchFn: respond({}, false) })).toBeNull()
  })

  it('returns null when the payload is rejected', async () => {
    expect(await fetchParsed('u', () => null, { fetchFn: respond({}) })).toBeNull()
  })

  it('returns null on a network error or invalid JSON', async () => {
    expect(await fetchParsed('u', (j) => j, { fetchFn: () => Promise.reject(new TypeError('offline')) })).toBeNull()
    const badJson = () => Promise.resolve({ ok: true, json: () => Promise.reject(new SyntaxError('x')) } as Response)
    expect(await fetchParsed('u', (j) => j, { fetchFn: badJson })).toBeNull()
  })
})
