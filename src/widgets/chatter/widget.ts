import { defineWidget } from '../registry'

export default defineWidget({
  id: 'chatter',
  exhibit: 'E',
  title: 'Are they talking about us?',
  subtitle: 'The front page, in rank order · Hacker News',
  span: 1,
  rows: 1,
  load: () => import('./Widget.vue'),
})
