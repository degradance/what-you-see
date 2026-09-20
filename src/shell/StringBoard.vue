<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

interface Link {
  from: string
  to: string
}

interface Point {
  x: number
  y: number
}

interface Segment {
  key: string
  path: string
  ends: [Point, Point]
}

const props = defineProps<{ links: readonly Link[] }>()

const PIN_INSET = 30

const root = ref<HTMLElement | null>(null)
const segments = ref<Segment[]>([])
const pins = computed(() =>
  segments.value.flatMap((segment) =>
    segment.ends.map((point, i) => ({ key: `${segment.key}:${i}`, ...point })),
  ),
)

function route(a: DOMRect, b: DOMRect, origin: DOMRect) {
  const at = (x: number, y: number): Point => ({
    x: Math.round(x - origin.left),
    y: Math.round(y - origin.top),
  })
  const horizontalGap = Math.max(b.left - a.right, a.left - b.right)
  const verticalGap = Math.max(b.top - a.bottom, a.top - b.bottom)
  if (horizontalGap <= 0 && verticalGap <= 0) return null

  if (horizontalGap >= verticalGap) {
    const [left, right] = a.left < b.left ? [a, b] : [b, a]
    const start = at(left.right, left.top + PIN_INSET)
    const end = at(right.left, right.top + PIN_INSET)
    return { start, end, control: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 + sag(start, end) } }
  }

  const [upper, lower] = a.top < b.top ? [a, b] : [b, a]
  const start = at(upper.left + PIN_INSET, upper.bottom)
  const end = at(lower.left + PIN_INSET, lower.top)
  return {
    start,
    end,
    control: { x: (start.x + end.x) / 2 + sag(start, end) / 2, y: (start.y + end.y) / 2 },
  }
}

// A longer string hangs lower; the clamp keeps short and very long strings looking natural.
function sag(start: Point, end: Point) {
  return Math.min(40, Math.max(12, Math.hypot(end.x - start.x, end.y - start.y) * 0.45))
}

function measure() {
  const el = root.value
  if (!el) return
  const origin = el.getBoundingClientRect()
  const rects = new Map<string, DOMRect>()
  el.querySelectorAll<HTMLElement>('[data-card-id]').forEach((card) => {
    if (card.dataset.cardId) rects.set(card.dataset.cardId, card.getBoundingClientRect())
  })

  const next: Segment[] = []
  for (const { from, to } of props.links) {
    const a = rects.get(from)
    const b = rects.get(to)
    const found = a && b ? route(a, b, origin) : null
    if (!found) continue
    const { start, control, end } = found
    next.push({
      key: `${from}:${to}`,
      path: `M${start.x} ${start.y}Q${control.x} ${control.y} ${end.x} ${end.y}`,
      ends: [start, end],
    })
  }
  segments.value = next
}

let frame = 0
let observer: ResizeObserver | undefined

const schedule = () => {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(measure)
}

onMounted(() => {
  const el = root.value
  if (!el) return
  observer = new ResizeObserver(schedule)
  observer.observe(el)
  el.querySelectorAll('[data-card-id]').forEach((card) => observer?.observe(card))
  void document.fonts.ready.then(schedule)
  schedule()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  observer?.disconnect()
})
</script>

<template>
  <div ref="root" class="relative">
    <svg class="layer" aria-hidden="true">
      <path v-for="segment in segments" :key="segment.key" :d="segment.path" pathLength="1" class="string" />
    </svg>
    <slot />
    <svg class="layer" aria-hidden="true">
      <g v-for="pin in pins" :key="pin.key">
        <circle :cx="pin.x" :cy="pin.y" r="6.5" class="pin" />
        <circle :cx="pin.x - 2" :cy="pin.y - 2" r="2" class="shine" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.string {
  fill: none;
  stroke: var(--signal);
  stroke-width: 2;
  stroke-linecap: round;
  filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.45));
}

.pin {
  fill: var(--signal);
  filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.5));
}

.shine {
  fill: rgb(255 255 255 / 0.4);
}

@media (prefers-reduced-motion: no-preference) {
  .string {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: draw 0.9s ease-out 0.8s forwards;
  }
}

@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
