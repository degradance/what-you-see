<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { widgets } from '@/widgets'
import Card from './Card.vue'
import Decrypting from './Decrypting.vue'
import Redacted from './Redacted.vue'
import SignalLost from './SignalLost.vue'
import StringBoard from './StringBoard.vue'

// Async wrappers are created once, outside render, so widgets are not reloaded on re-render.
const cards = widgets.map((def) => ({
  def,
  component: defineAsyncComponent({
    loader: def.load,
    loadingComponent: Decrypting,
    errorComponent: SignalLost,
    delay: 0,
    timeout: 15_000,
  }),
}))

const links = [
  { from: 'wiki-live', to: 'redacted' },
  { from: 'wiki-live', to: 'seismic' },
]

const SPAN = { 1: '', 2: 'lg:col-span-2' } as const
</script>

<template>
  <section aria-label="Evidence board">
    <StringBoard :links="links" class="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-x-14">
      <Card
        v-for="{ def, component } in cards"
        :key="def.id"
        :card-id="def.id"
        :class="SPAN[def.span]"
        :exhibit="def.exhibit"
        :title="def.title"
        :subtitle="def.subtitle"
        :stamp="def.stamp"
      >
        <component :is="component" />
      </Card>

      <Card
        card-id="redacted"
        exhibit="C–E"
        title="Access denied"
        subtitle="Hover, tap or focus a bar to declassify it."
        stamp="Redacted"
      >
        <Redacted />
      </Card>
    </StringBoard>
  </section>
</template>
