import * as v from 'valibot'

// Editor names are deliberately not parsed: anonymous edits are attributed to IP addresses.
const ChangeSchema = v.object({
  type: v.picklist(['edit', 'new']),
  title: v.string(),
  bot: v.boolean(),
  meta: v.object({ id: v.string(), domain: v.string() }),
})

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
