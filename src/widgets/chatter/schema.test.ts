import { describe, expect, it } from 'vitest'
import { parseIds, parseStory } from './schema'

const item = (over: Record<string, unknown> = {}) => ({
  id: 41_000_001,
  type: 'story',
  by: 'someone',
  title: 'A story',
  score: 250,
  descendants: 80,
  url: 'https://www.example.com/post?x=1',
  time: 1_789_928_379,
  ...over,
})

describe('parseStory', () => {
  it('maps an item to a flat story and never carries the author', () => {
    const story = parseStory(item())
    expect(story).toEqual({
      id: 41_000_001,
      title: 'A story',
      score: 250,
      comments: 80,
      url: 'https://www.example.com/post?x=1',
      host: 'example.com',
    })
    expect(story).not.toHaveProperty('by')
  })

  it('counts a missing `descendants` as no comments', () => {
    expect(parseStory(item({ descendants: undefined }))?.comments).toBe(0)
  })

  it('keeps a post without a link, such as Ask HN', () => {
    expect(parseStory(item({ url: undefined }))).toMatchObject({ url: null, host: null })
  })

  it('treats a link that is not plain http(s) as absent', () => {
    expect(parseStory(item({ url: 'javascript:alert(1)' }))).toMatchObject({ url: null, host: null })
    expect(parseStory(item({ url: 'data:text/html,hi' }))).toMatchObject({ url: null, host: null })
    expect(parseStory(item({ url: 'not a url' }))).toMatchObject({ url: null, host: null })
  })

  it('rejects what is not a live story', () => {
    expect(parseStory(null)).toBeNull()
    expect(parseStory('garbage')).toBeNull()
    expect(parseStory(item({ type: 'job' }))).toBeNull()
    expect(parseStory(item({ dead: true }))).toBeNull()
    expect(parseStory(item({ deleted: true }))).toBeNull()
    expect(parseStory(item({ title: '' }))).toBeNull()
    expect(parseStory(item({ score: 'many' }))).toBeNull()
    expect(parseStory(item({ id: 0 }))).toBeNull()
  })
})

describe('parseIds', () => {
  it('returns the ids in order', () => {
    expect(parseIds([3, 1, 2])).toEqual([3, 1, 2])
  })

  it('skips entries that are not ids', () => {
    expect(parseIds([1, 'x', null, 2.5, -4, 0, 7])).toEqual([1, 7])
  })

  it('rejects a payload with no usable id', () => {
    expect(parseIds([])).toBeNull()
    expect(parseIds(['a'])).toBeNull()
    expect(parseIds({ ids: [1] })).toBeNull()
    expect(parseIds(null)).toBeNull()
  })
})
