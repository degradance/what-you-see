<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { widgets } from '@/widgets'
import ThemeToggle from './ThemeToggle.vue'
import { useActiveExhibit } from './useActiveExhibit'

defineProps<{ fileNumber: string }>()

const exhibits = widgets.map((def) => ({ id: `exhibit-${def.exhibit.toLowerCase()}`, letter: def.exhibit, short: def.short }))
const active = useActiveExhibit(exhibits.map((e) => e.id))

// The panel must not cost what it measures: its chunk loads only once the page has loaded and the main thread is idle.
// Its observers are buffered, so it still sees the LCP that happened before it arrived.
function whenIdle(): Promise<void> {
  const loaded =
    document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise<void>((resolve) => addEventListener('load', () => resolve(), { once: true }))
  return loaded.then(
    () =>
      new Promise<void>((resolve) =>
        'requestIdleCallback' in window ? requestIdleCallback(() => resolve(), { timeout: 2000 }) : setTimeout(resolve, 200),
      ),
  )
}
const PerfHud = defineAsyncComponent(() => whenIdle().then(() => import('./hud/PerfHud.vue')))
</script>

<template>
  <!-- Solid, not frosted: a backdrop blur repaints everything under the bar on every scrolled frame. -->
  <div class="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface sm:top-0 sm:bottom-auto sm:border-t-0 sm:border-b">
    <div class="mx-auto flex h-12 max-w-6xl items-center gap-2 px-2 sm:gap-4 sm:px-8">
      <span class="hidden label whitespace-nowrap text-signal lg:inline">
        № {{ fileNumber }}
      </span>
      <!-- The list takes the free width and keeps its items at the start, so the panel arriving later moves nothing. -->
      <nav aria-label="Exhibits" class="min-w-0 flex-1 self-stretch">
        <ul class="flex h-full items-stretch">
          <li v-for="e in exhibits" :key="e.id">
            <a
              :href="`#${e.id}`"
              :aria-current="active === e.id ? 'location' : undefined"
              :aria-label="`Exhibit ${e.letter}: ${e.short}`"
              class="flex h-full items-center gap-1.5 border-b-2 px-2.5 label transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-signal motion-reduce:transition-none sm:px-2"
              :class="active === e.id ? 'border-signal text-signal' : 'border-transparent text-muted hover:text-ink'"
            >
              <span class="font-semibold">{{ e.letter }}</span>
              <span class="hidden lg:inline">{{ e.short }}</span>
            </a>
          </li>
        </ul>
      </nav>
      <PerfHud />
      <ThemeToggle />
    </div>
  </div>
</template>
