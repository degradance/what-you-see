import { onCLS, onINP, onLCP, type Metric } from 'web-vitals'

export type VitalName = 'LCP' | 'INP' | 'CLS'
export type Rating = Metric['rating']
export interface Vital {
  name: VitalName
  value: number
  rating: Rating
}

// The observers are buffered, so a panel loaded after the page settled still sees the LCP that already happened.
// `reportAllChanges` streams interim values: LCP is only final after the first input, INP only exists after one.
export function watchVitals(onChange: (vital: Vital) => void): void {
  const report = ({ name, value, rating }: Metric) => onChange({ name: name as VitalName, value, rating })
  onLCP(report, { reportAllChanges: true })
  onINP(report, { reportAllChanges: true })
  onCLS(report, { reportAllChanges: true })
}

// Long animation frames (Chromium) say which frames stalled; `longtask` is the older, coarser fallback.
export function watchLongFrames(onFrame: (durationMs: number) => void): () => void {
  const type = PerformanceObserver.supportedEntryTypes?.includes('long-animation-frame')
    ? 'long-animation-frame'
    : PerformanceObserver.supportedEntryTypes?.includes('longtask')
      ? 'longtask'
      : undefined
  if (!type) return () => {}
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) onFrame(entry.duration)
  })
  observer.observe({ type, buffered: true })
  return () => observer.disconnect()
}

export function watchResources(onEntries: (entries: PerformanceResourceTiming[]) => void): () => void {
  if (typeof PerformanceObserver === 'undefined') return () => {}
  const observer = new PerformanceObserver((list) => onEntries(list.getEntries() as PerformanceResourceTiming[]))
  observer.observe({ type: 'resource', buffered: true })
  return () => observer.disconnect()
}
