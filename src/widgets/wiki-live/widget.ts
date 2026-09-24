import { defineWidget } from '../registry'
import Skeleton from './Skeleton.vue'

export default defineWidget({
  id: 'wiki-live',
  exhibit: 'A',
  short: 'Edits',
  title: 'What is the world writing right now?',
  subtitle: 'Live edits across Wikipedia and its sister projects · stream.wikimedia.org',
  span: 2,
  rows: 1,
  load: () => import('./Widget.vue'),
  skeleton: Skeleton,
})
