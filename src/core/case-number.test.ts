import { describe, expect, it } from 'vitest'
import { caseNumber } from './case-number'

describe('caseNumber', () => {
  it('starts at 0001, never at 0000', () => {
    expect(caseNumber(() => 0)).toBe('0001')
  })

  it('ends at 9999 for the largest value random() can return', () => {
    expect(caseNumber(() => 0.999999)).toBe('9999')
  })

  it('pads to four digits', () => {
    expect(caseNumber(() => 0.0417)).toBe('0417')
  })

  it('is different from one call to the next with the real random source', () => {
    const seen = new Set(Array.from({ length: 20 }, () => caseNumber()))
    expect(seen.size).toBeGreaterThan(1)
  })
})
