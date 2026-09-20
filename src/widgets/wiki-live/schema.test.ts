import { describe, expect, it } from 'vitest'
import { parseChange } from './schema'

const edit = {
  type: 'edit',
  title: 'Fuli, Yangshuo County',
  user: '203.0.113.7',
  bot: false,
  meta: { id: 'a58389e0-7c51-47b3-ab2b-dde9ad79cec2', domain: 'en.wikipedia.org' },
}

describe('parseChange', () => {
  it('accepts edits and new pages', () => {
    expect(parseChange(JSON.stringify(edit))?.title).toBe('Fuli, Yangshuo County')
    expect(parseChange(JSON.stringify({ ...edit, type: 'new' }))?.type).toBe('new')
  })

  it('drops the editor identity', () => {
    expect(parseChange(JSON.stringify(edit))).not.toHaveProperty('user')
  })

  it('drops event types we do not show', () => {
    expect(parseChange(JSON.stringify({ ...edit, type: 'categorize' }))).toBeNull()
    expect(parseChange(JSON.stringify({ ...edit, type: 'log' }))).toBeNull()
  })

  it('drops malformed input instead of throwing', () => {
    expect(parseChange('not json')).toBeNull()
    expect(parseChange('{}')).toBeNull()
    expect(parseChange(JSON.stringify({ ...edit, bot: 'no' }))).toBeNull()
  })
})
