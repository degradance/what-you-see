import { describe, expect, it } from 'vitest'
import { ChangePipeline } from './pipeline'
import type { Change } from './schema'

const change = (id: string, bot = false): Change => ({ type: 'edit', title: id, bot, meta: { id, domain: 'en.wikipedia.org' } })

describe('ChangePipeline', () => {
  it('reports the feed newest first, and only when it changed', () => {
    const pipeline = new ChangePipeline()
    pipeline.add(change('a'), 1_000)
    pipeline.add(change('b'), 1_000)
    expect(pipeline.snapshot(1_000).feed?.map((c) => c.title)).toEqual(['b', 'a'])
    expect(pipeline.snapshot(1_000).feed).toBeUndefined()
  })

  it('counts humans and bots apart', () => {
    const pipeline = new ChangePipeline()
    pipeline.add(change('a'), 1_000)
    pipeline.add(change('b', true), 1_000)
    pipeline.add(change('c', true), 1_000)
    const { humansPerSec, botsPerSec } = pipeline.snapshot(2_000)
    expect(humansPerSec).toBe(1)
    expect(botsPerSec).toBe(2)
  })
})
