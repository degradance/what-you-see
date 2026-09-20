import { describe, expect, it } from 'vitest'
import { RingBuffer } from './ring-buffer'

describe('RingBuffer', () => {
  it('returns entries newest first', () => {
    const buf = new RingBuffer<number>(3)
    buf.push(1)
    buf.push(2)
    expect(buf.latest()).toEqual([2, 1])
    expect(buf.size).toBe(2)
  })

  it('overwrites the oldest entry once full', () => {
    const buf = new RingBuffer<number>(3)
    for (const n of [1, 2, 3, 4, 5]) buf.push(n)
    expect(buf.latest()).toEqual([5, 4, 3])
    expect(buf.size).toBe(3)
  })

  it('limits the result to `count`', () => {
    const buf = new RingBuffer<number>(5)
    for (const n of [1, 2, 3, 4]) buf.push(n)
    expect(buf.latest(2)).toEqual([4, 3])
    expect(buf.latest(99)).toEqual([4, 3, 2, 1])
  })

  it('can be cleared', () => {
    const buf = new RingBuffer<number>(2)
    buf.push(1)
    buf.clear()
    expect(buf.latest()).toEqual([])
    expect(buf.size).toBe(0)
  })

  it('rejects invalid capacity', () => {
    expect(() => new RingBuffer(0)).toThrow(RangeError)
    expect(() => new RingBuffer(1.5)).toThrow(RangeError)
  })
})
