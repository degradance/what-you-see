import { describe, expect, it } from 'vitest'
import { clamp, easeFactor, shortestDelta } from './view'

describe('shortestDelta', () => {
  it.each([
    [0, 90, 90],
    [90, 0, -90],
    [170, -170, 20],
    [-170, 170, -20],
    [10, 370, 0],
    [0, 720 + 30, 30],
  ])('from %d to %d is %d', (from, to, expected) => {
    expect(shortestDelta(from, to)).toBeCloseTo(expected)
  })
})

describe('easeFactor', () => {
  it('halves the distance after one half-life and does nothing without time', () => {
    expect(easeFactor(250, 250)).toBeCloseTo(0.5)
    expect(easeFactor(0, 250)).toBe(0)
  })

  it('converges towards 1 for long gaps', () => {
    expect(easeFactor(10_000, 250)).toBeGreaterThan(0.999)
  })
})

describe('clamp', () => {
  it('keeps a value inside the range', () => {
    expect(clamp(50, -35, 35)).toBe(35)
    expect(clamp(-50, -35, 35)).toBe(-35)
    expect(clamp(10, -35, 35)).toBe(10)
  })
})
