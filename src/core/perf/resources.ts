export type ResourceLike = Pick<PerformanceResourceTiming, 'name' | 'encodedBodySize'>

export interface ResourceTotals {
  js: { bytes: number; files: number }
  css: { bytes: number; files: number }
  fonts: { bytes: number; files: number }
}

const KIND = { js: 'js', mjs: 'js', css: 'css', woff2: 'fonts', woff: 'fonts' } as const

// Sizes come from `encodedBodySize`: the compressed body, the same on a cache hit, where `transferSize` drops to 0.
// Cross-origin entries without Timing-Allow-Origin report 0 and so add nothing, which is right: only our own bytes count.
export function summarizeResources(entries: Iterable<ResourceLike>): ResourceTotals {
  const totals: ResourceTotals = {
    js: { bytes: 0, files: 0 },
    css: { bytes: 0, files: 0 },
    fonts: { bytes: 0, files: 0 },
  }
  const seen = new Set<string>()
  for (const entry of entries) {
    if (seen.has(entry.name) || entry.encodedBodySize <= 0) continue
    const kind = KIND[extension(entry.name) as keyof typeof KIND]
    if (!kind) continue
    seen.add(entry.name)
    totals[kind].bytes += entry.encodedBodySize
    totals[kind].files++
  }
  return totals
}

function extension(url: string): string {
  const path = url.split(/[?#]/, 1)[0] ?? ''
  const dot = path.lastIndexOf('.')
  return dot > path.lastIndexOf('/') ? path.slice(dot + 1).toLowerCase() : ''
}
