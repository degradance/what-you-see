import { defineWidget } from '../registry'

export default defineWidget({
  id: 'seismic',
  exhibit: 'B',
  short: 'Quakes',
  title: 'Where did the ground move today?',
  subtitle: 'Earthquakes of the past 24 hours, M2.5 and up · earthquake.usgs.gov',
  span: 1,
  rows: 2,
  load: () => import('./Widget.vue'),
})
