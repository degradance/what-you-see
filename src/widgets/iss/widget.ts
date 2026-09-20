import { defineWidget } from '../registry'

export default defineWidget({
  id: 'iss',
  exhibit: 'C',
  title: 'Is something watching us from above?',
  subtitle: 'The International Space Station, position and trail · wheretheiss.at',
  span: 2,
  rows: 1,
  load: () => import('./Widget.vue'),
})
