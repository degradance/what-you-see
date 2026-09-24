// Records the Wikimedia recent-changes stream for Exhibit A's replay: node scripts/record-wikimedia.mjs [seconds]
// Keeps only what the widget parses, plus each message's size, so a replay costs the parser what the live stream does.
// Every message is kept, including the kinds the widget rejects; titles are dropped where they are editor names
// (user and user-talk pages) and wherever the widget would not show them.
import { writeFileSync } from 'node:fs'

const STREAM = 'https://stream.wikimedia.org/v2/stream/recentchange'
const OUT = new URL('../src/widgets/wiki-live/recording.json', import.meta.url)
const SECONDS = Number(process.argv[2] ?? 60)
const USER_NAMESPACES = new Set([2, 3])

const domains = []
const domainIndex = new Map()
const events = []
let start

const controller = new AbortController()
setTimeout(() => controller.abort(), SECONDS * 1000)

// Kinds: 0 edit, 1 new page, 2 anything the widget drops (logs, categorisation, user pages).
function kindOf(change) {
  if (USER_NAMESPACES.has(change.namespace)) return 2
  if (change.type === 'edit') return 0
  if (change.type === 'new') return 1
  return 2
}

function keep(change, bytes) {
  const domain = change.meta?.domain
  if (typeof domain !== 'string') return
  const kind = kindOf(change)
  const now = Date.now()
  start ??= now
  if (!domainIndex.has(domain)) {
    domainIndex.set(domain, domains.length)
    domains.push(domain)
  }
  // [ms since the first event, domain index, kind, 1 = bot, message size in bytes, title]
  const title = kind === 2 || typeof change.title !== 'string' ? '' : change.title
  events.push([now - start, domainIndex.get(domain), kind, change.bot ? 1 : 0, bytes, title])
}

try {
  const response = await fetch(STREAM, {
    headers: { Accept: 'text/event-stream', 'User-Agent': 'what-you-see recorder (github.com/degradance/what-you-see)' },
    signal: controller.signal,
  })
  const decoder = new TextDecoder()
  let buffer = ''
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true })
    let end
    while ((end = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, end)
      buffer = buffer.slice(end + 1)
      if (!line.startsWith('data: ')) continue
      try {
        keep(JSON.parse(line.slice(6)), Buffer.byteLength(line) - 6)
      } catch {
        // A partial or malformed line is skipped, like the live widget does.
      }
    }
  }
} catch (error) {
  if (error.name !== 'AbortError') throw error
}

const durationMs = SECONDS * 1000
writeFileSync(OUT, JSON.stringify({ recordedAt: new Date().toISOString().slice(0, 10), durationMs, domains, events }))
console.log(`${events.length} events, ${domains.length} domains, ${(events.length / SECONDS).toFixed(1)} per second`)
