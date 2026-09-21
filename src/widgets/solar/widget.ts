import { defineWidget } from '../registry'

export default defineWidget({
  id: 'solar',
  exhibit: 'D',
  title: 'How is the Sun feeling today?',
  subtitle: 'Planetary K-index, three-hour readings · NOAA SWPC',
  span: 2,
  rows: 1,
  load: () => import('./Widget.vue'),
})
