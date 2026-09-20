<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { widgets } from '@/widgets'
import Card from './Card.vue'
import Decrypting from './Decrypting.vue'
import SignalLost from './SignalLost.vue'

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

const SPAN = { 1: '', 2: 'lg:col-span-2' } as const
</script>

<template>
  <section aria-label="Evidence board" class="grid grid-cols-1 gap-8 lg:grid-cols-3">
    <Card
      v-for="{ def, component } in cards"
      :key="def.id"
      :class="SPAN[def.span]"
      :exhibit="def.exhibit"
      :title="def.title"
      :subtitle="def.subtitle"
      :stamp="def.stamp"
    >
      <component :is="component" />
    </Card>

    <Card
      exhibit="B–E"
      title="Access denied"
      subtitle="More exhibits are being declassified."
      stamp="Redacted"
    >
      <p class="sr-only">Redacted.</p>
      <div class="flex flex-col gap-2.5" aria-hidden="true">
        <span class="block h-[1.1em] w-[88%] bg-ink" />
        <span class="block h-[1.1em] w-[64%] bg-ink" />
        <span class="block h-[1.1em] w-[76%] bg-ink" />
        <span class="block h-[1.1em] w-[41%] bg-ink" />
      </div>
    </Card>
  </section>
</template>
