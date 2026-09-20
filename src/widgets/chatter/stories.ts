import type { Story } from './schema'

export const discussionUrl = (id: number) => `https://news.ycombinator.com/item?id=${id}`

export const totalComments = (stories: readonly Story[]) => stories.reduce((sum, s) => sum + s.comments, 0)

// On a tie the higher-ranked story wins, because the list is already in rank order.
export function busiest(stories: readonly Story[]): Story | null {
  return stories.reduce<Story | null>((best, s) => (best && best.comments >= s.comments ? best : s), null)
}

const plural = (n: number, one: string, many: string) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`

export const formatPoints = (n: number) => plural(n, 'point', 'points')
export const formatComments = (n: number) => plural(n, 'comment', 'comments')
