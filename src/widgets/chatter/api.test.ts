import { describe, expect, it, vi } from 'vitest'
import { loadFrontPage, STORY_COUNT } from './api'

const json = (body: unknown, ok = true) =>
  Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response)

const item = (id: number) => ({ id, type: 'story', title: `Story ${id}`, score: 1, descendants: 2 })

// Answers `topstories.json` with `ids` and every item from `items`, or with an error status when it is missing.
const fakeApi = (ids: unknown, items: Record<number, unknown>) =>
  vi.fn((url: string | URL | Request) => {
    const target = String(url)
    if (target.endsWith('/topstories.json')) return json(ids)
    const id = Number(/item\/(\d+)\.json$/.exec(target)?.[1])
    return id in items ? json(items[id]) : json(null, false)
  })

describe('loadFrontPage', () => {
  it('returns the stories in rank order, whatever order the answers arrive in', async () => {
    const fetchFn = vi.fn((url: string | URL | Request) => {
      const target = String(url)
      if (target.endsWith('/topstories.json')) return json([30, 10, 20])
      const id = Number(/item\/(\d+)\.json$/.exec(target)?.[1])
      // The first story answers last.
      return new Promise<Response>((resolve) => setTimeout(() => resolve(json(item(id)) as unknown as Response), id === 30 ? 20 : 0))
    })
    const stories = await loadFrontPage({ fetchFn })
    expect(stories?.map((s) => s.id)).toEqual([30, 10, 20])
  })

  it('asks for the top stories only', async () => {
    const ids = Array.from({ length: 500 }, (_, i) => i + 1)
    const fetchFn = fakeApi(ids, Object.fromEntries(ids.map((id) => [id, item(id)])))
    const stories = await loadFrontPage({ fetchFn })
    expect(stories).toHaveLength(STORY_COUNT)
    expect(fetchFn).toHaveBeenCalledTimes(1 + STORY_COUNT)
  })

  it('drops a story that failed and keeps the rest', async () => {
    const fetchFn = fakeApi([1, 2, 3, 4], { 1: item(1), 2: { ...item(2), dead: true }, 3: null, 4: item(4) })
    expect((await loadFrontPage({ fetchFn }))?.map((s) => s.id)).toEqual([1, 4])
  })

  it('fails the round when nothing usable came back', async () => {
    expect(await loadFrontPage({ fetchFn: fakeApi([1, 2], {}) })).toBeNull()
  })

  it('fails the round when the list of ids is bad', async () => {
    expect(await loadFrontPage({ fetchFn: fakeApi({ nope: true }, {}) })).toBeNull()
    expect(await loadFrontPage({ fetchFn: () => json(null, false) })).toBeNull()
    expect(await loadFrontPage({ fetchFn: () => Promise.reject(new TypeError('offline')) })).toBeNull()
  })
})
