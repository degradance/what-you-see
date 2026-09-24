import { describe, expect, it } from 'vitest'
import { formatCls, formatKB, formatMs } from './format'
import { FrameMeter } from './frames'
import { summarizeResources } from './resources'

describe('FrameMeter', () => {
  it('has nothing to say before the first frame', () => {
    expect(new FrameMeter().flush(1000)).toBeUndefined()
  })

  it('counts frames per second and keeps the worst gap', () => {
    const meter = new FrameMeter()
    for (let t = 0; t < 1000; t += 16) meter.tick(t)
    meter.tick(1060)
    expect(meter.flush(1066)).toEqual({ fps: 60, worstMs: 68 })
  })

  it('starts a fresh window after a flush', () => {
    const meter = new FrameMeter()
    meter.tick(0)
    meter.tick(500)
    meter.flush(1000)
    meter.tick(1100)
    expect(meter.flush(2000)).toEqual({ fps: 1, worstMs: 600 })
  })

  it('does not count the gap across a reset as a stall', () => {
    const meter = new FrameMeter()
    meter.tick(0)
    meter.reset()
    meter.tick(5000)
    meter.tick(5016)
    expect(meter.flush(6000)?.worstMs).toBe(16)
  })
})

describe('summarizeResources', () => {
  it('groups compressed sizes by kind and ignores the rest', () => {
    const totals = summarizeResources([
      { name: 'https://x.test/assets/index-a1.js', encodedBodySize: 30_000 },
      { name: 'https://x.test/assets/Widget-b2.js?v=1', encodedBodySize: 2_000 },
      { name: 'https://x.test/assets/index-c3.css', encodedBodySize: 6_000 },
      { name: 'https://x.test/assets/mono-400.woff2', encodedBodySize: 20_000 },
      { name: 'https://api.test/feed.json', encodedBodySize: 9_000 },
      { name: 'https://x.test/og.png', encodedBodySize: 50_000 },
    ])
    expect(totals).toEqual({
      js: { bytes: 32_000, files: 2 },
      css: { bytes: 6_000, files: 1 },
      fonts: { bytes: 20_000, files: 1 },
    })
  })

  it('counts a file once and skips opaque cross-origin entries', () => {
    const totals = summarizeResources([
      { name: 'https://x.test/a.js', encodedBodySize: 1_000 },
      { name: 'https://x.test/a.js', encodedBodySize: 1_000 },
      { name: 'https://cdn.test/b.js', encodedBodySize: 0 },
      { name: 'https://x.test/v1.2/data', encodedBodySize: 500 },
    ])
    expect(totals.js).toEqual({ bytes: 1_000, files: 1 })
  })
})

describe('format', () => {
  it('picks a readable precision', () => {
    expect(formatMs(4.26)).toBe('4.3 ms')
    expect(formatMs(24.4)).toBe('24 ms')
    expect(formatMs(1130)).toBe('1.1 s')
    expect(formatKB(2_048)).toBe('2.0 KB')
    expect(formatKB(31_320)).toBe('31 KB')
    expect(formatCls(0.0412)).toBe('0.04')
  })
})
