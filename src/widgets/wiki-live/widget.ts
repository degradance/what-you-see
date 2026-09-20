import { defineWidget } from '../registry'

export default defineWidget({
  id: 'wiki-live',
  exhibit: 'A',
  title: 'Who is rewriting history right now?',
  subtitle: 'Live edits across Wikipedia and its sister projects · stream.wikimedia.org',
  span: 2,
  rows: 1,
  load: () => import('./Widget.vue'),
})
