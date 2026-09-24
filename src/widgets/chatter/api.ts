import { fetchParsed } from '@/core/streams/fetch-json'
import { STORY_COUNT } from './layout'
import { parseIds, parseStory, type Story } from './schema'

export { STORY_COUNT }

const API = 'https://hacker-news.firebaseio.com/v0'
// The API has no "top ten with details" call: one request lists ids, then each story is its own request.

export interface LoadOptions {
  signal?: AbortSignal
  fetchFn?: typeof fetch
}

// A story that fails on its own (deleted, dead, a flaky request) only shortens the list. Only a round with
// nothing usable counts as failed, so `pollTask` backs off instead of showing an empty front page.
export async function loadFrontPage({ signal, fetchFn }: LoadOptions = {}): Promise<Story[] | null> {
  const ids = await fetchParsed(`${API}/topstories.json`, parseIds, { signal, fetchFn })
  if (!ids) return null
  // `Promise.all` keeps the order of the ids, so the list stays in rank order.
  const stories = await Promise.all(
    ids.slice(0, STORY_COUNT).map((id) => fetchParsed(`${API}/item/${id}.json`, parseStory, { signal, fetchFn })),
  )
  const kept = stories.filter((s): s is Story => s !== null)
  return kept.length > 0 ? kept : null
}
