import { defineWidget } from '../registry'
import Skeleton from './Skeleton.vue'

export default defineWidget({
  id: 'iss',
  exhibit: 'C',
  short: 'ISS',
  title: 'What is passing overhead?',
  subtitle: 'The International Space Station, position and trail · wheretheiss.at',
  span: 2,
  rows: 1,
  load: () => import('./Widget.vue'),
  skeleton: Skeleton,
})
