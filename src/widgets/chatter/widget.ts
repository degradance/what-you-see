import { defineWidget } from '../registry'

export default defineWidget({
  id: 'chatter',
  exhibit: 'E',
  title: 'What is everyone talking about?',
  subtitle: 'The front page, in rank order · Hacker News',
  span: 1,
  rows: 1,
  load: () => import('./Widget.vue'),
})
