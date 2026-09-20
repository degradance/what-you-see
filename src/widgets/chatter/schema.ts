import * as v from 'valibot'

// Only what the row shows is declared. The author (`by`) is left out on purpose: valibot drops undeclared keys,
// so a username never reaches the widget even though the API sends it.
const ItemSchema = v.object({
  id: v.pipe(v.number(), v.integer(), v.minValue(1)),
  type: v.literal('story'),
  title: v.pipe(v.string(), v.minLength(1)),
  score: v.pipe(v.number(), v.minValue(0)),
  // The field is absent, not zero, while a story has no comments.
  descendants: v.optional(v.pipe(v.number(), v.minValue(0)), 0),
  url: v.optional(v.string()),
  dead: v.optional(v.boolean()),
  deleted: v.optional(v.boolean()),
})

export interface Story {
  id: number
  title: string
  score: number
  comments: number
  // The article, when it is a web address; Ask and Show posts have none.
  url: string | null
  // Where the article lives, without `www.`; `null` when there is no article.
  host: string | null
}

// A link is followed on a click, so anything that is not plain http(s) (`javascript:`, `data:`) is treated as absent.
function webLink(raw: string | undefined): { url: string; host: string } | null {
  if (!raw) return null
  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
    return { url: parsed.href, host: parsed.hostname.replace(/^www\./, '') }
  } catch {
    return null
  }
}

// The API answers `null` for an item that does not exist, which fails here like any other bad shape.
export function parseStory(json: unknown): Story | null {
  const result = v.safeParse(ItemSchema, json)
  if (!result.success) return null
  const { id, title, score, descendants, url, dead, deleted } = result.output
  if (dead || deleted) return null
  const link = webLink(url)
  return { id, title, score, comments: descendants, url: link?.url ?? null, host: link?.host ?? null }
}

// Ids that are not positive integers are skipped one by one; a payload with no usable id is rejected.
export function parseIds(json: unknown): number[] | null {
  if (!Array.isArray(json)) return null
  const ids = json.filter((id): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0)
  return ids.length > 0 ? ids : null
}
