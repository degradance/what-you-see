import { describe, expect, it } from 'vitest'
import type { Story } from './schema'
import { busiest, discussionUrl, formatComments, formatPoints, totalComments } from './stories'

const story = (id: number, comments: number): Story => ({
  id,
  title: `Story ${id}`,
  score: 10,
  comments,
  url: null,
  host: null,
})

describe('totalComments', () => {
  it('adds up the comments', () => {
    expect(totalComments([story(1, 10), story(2, 5), story(3, 0)])).toBe(15)
  })

  it('is zero for an empty list', () => {
    expect(totalComments([])).toBe(0)
  })
})

describe('busiest', () => {
  it('picks the story with the most comments', () => {
    expect(busiest([story(1, 10), story(2, 50), story(3, 20)])?.id).toBe(2)
  })

  it('prefers the higher-ranked story on a tie', () => {
    expect(busiest([story(1, 30), story(2, 30)])?.id).toBe(1)
  })

  it('is null for an empty list', () => {
    expect(busiest([])).toBeNull()
  })
})

describe('formatting', () => {
  it('pluralises', () => {
    expect(formatPoints(1)).toBe('1 point')
    expect(formatPoints(0)).toBe('0 points')
    expect(formatComments(1)).toBe('1 comment')
    expect(formatComments(1234)).toBe('1,234 comments')
  })

  it('links the discussion page', () => {
    expect(discussionUrl(42)).toBe('https://news.ycombinator.com/item?id=42')
  })
})
