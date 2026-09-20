import { defineWidget } from '../registry'

export default defineWidget({
  id: 'seismic',
  exhibit: 'B',
  title: 'Is the ground trying to tell us something?',
  subtitle: 'Earthquakes of the past 24 hours, M2.5 and up · earthquake.usgs.gov',
  stamp: 'Live',
  span: 1,
  load: () => import('./Widget.vue'),
})
