import * as v from 'valibot'

// User and user-talk pages: their titles are editor names ("User talk:Jane", "Benutzer:Jane") in every language.
const USER_NAMESPACES = new Set([2, 3])
export const WITHHELD_TITLE = 'User page · name withheld'

// Editor names are deliberately not parsed: anonymous edits are attributed to IP addresses. The same goes for titles
// that are names; those edits still count towards the rates.
const ChangeSchema = v.pipe(
  v.object({
    type: v.picklist(['edit', 'new']),
    title: v.string(),
    namespace: v.optional(v.number()),
    bot: v.boolean(),
    meta: v.object({ id: v.string(), domain: v.string() }),
  }),
  v.transform(({ namespace, title, ...change }) => ({
    ...change,
    title: namespace !== undefined && USER_NAMESPACES.has(namespace) ? WITHHELD_TITLE : title,
  })),
)

export type Change = v.InferOutput<typeof ChangeSchema>

export function parseChange(raw: string): Change | null {
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return null
  }
  const result = v.safeParse(ChangeSchema, json)
  return result.success ? result.output : null
}
