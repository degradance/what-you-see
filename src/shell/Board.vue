<script setup lang="ts">
import { defineAsyncComponent, reactive } from 'vue'
import type { StreamStatus } from '@/core/streams/sse'
import { widgets } from '@/widgets'
import Card from './Card.vue'
import Decrypting from './Decrypting.vue'
import Redacted from './Redacted.vue'
import SignalLost from './SignalLost.vue'
import StringBoard from './StringBoard.vue'

// Every widget is a live feed and reports its connection state; a card shows it in its corner.
const statuses = reactive<Record<string, StreamStatus>>(
  Object.fromEntries(widgets.map((def) => [def.id, 'connecting' as const])),
)

// Async wrappers are created once, outside render, so widgets are not reloaded on re-render.
const cards = widgets.map((def) => ({
  def,
  component: defineAsyncComponent({
    loader: def.load,
    loadingComponent: Decrypting,
    errorComponent: SignalLost,
    delay: 0,
    timeout: 15_000,
    // A chunk that cannot load is a lost signal too; without this the corner would say "connecting" forever.
    onError(_error, _retry, fail) {
      statuses[def.id] = 'reconnecting'
      fail()
    },
  }),
}))

// The strings follow the story order, and each pair is adjacent on the board so a string never crosses a card.
const links = [
  { from: 'wiki-live', to: 'seismic' },
  { from: 'seismic', to: 'iss' },
  { from: 'iss', to: 'redacted' },
]

// Full class names, not built strings: Tailwind only generates utilities it can find in the source.
const SPAN = { 1: '', 2: 'lg:col-span-2' } as const
const ROWS = { 1: '', 2: 'lg:row-span-2' } as const
</script>

<template>
  <section aria-label="Evidence board">
    <StringBoard :links="links" class="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
      <Card
        v-for="{ def, component } in cards"
        :key="def.id"
        :card-id="def.id"
        :class="[SPAN[def.span], ROWS[def.rows]]"
        :exhibit="def.exhibit"
        :title="def.title"
        :subtitle="def.subtitle"
        :status="statuses[def.id]"
      >
        <component :is="component" @status="statuses[def.id] = $event" />
      </Card>

      <Card
        card-id="redacted"
        exhibit="D–E"
        title="Access denied"
        subtitle="Hover, tap or focus a bar to declassify it."
        stamp="Redacted"
      >
        <Redacted />
      </Card>
    </StringBoard>
  </section>
</template>
