export const formatMs = (ms: number): string =>
  ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : ms >= 10 ? `${Math.round(ms)} ms` : `${ms.toFixed(1)} ms`

// Decimal kilobytes, the unit Vite prints for the build, so the panel and the build log agree.
export const formatKB = (bytes: number): string => `${(bytes / 1000).toFixed(bytes < 10_000 ? 1 : 0)} KB`

export const formatCls = (value: number): string => value.toFixed(2)

// Per-message costs are fractions of a millisecond; microseconds keep them readable.
export const formatUs = (ms: number): string => `${Math.round(ms * 1000)} µs`
