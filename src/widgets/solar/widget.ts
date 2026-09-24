import { defineWidget } from '../registry'
import Skeleton from './Skeleton.vue'

export default defineWidget({
  id: 'solar',
  exhibit: 'D',
  short: 'Sun',
  title: 'How is the Sun feeling today?',
  subtitle: 'Planetary K-index, three-hour readings · NOAA SWPC',
  span: 2,
  rows: 1,
  load: () => import('./Widget.vue'),
  skeleton: Skeleton,
})
