import { defineWidget } from '../registry'

export default defineWidget({
  id: 'iss',
  exhibit: 'C',
  title: 'What is passing overhead?',
  subtitle: 'The International Space Station, position and trail · wheretheiss.at',
  span: 2,
  rows: 1,
  load: () => import('./Widget.vue'),
})
