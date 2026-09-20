<script setup lang="ts">
import type { StreamStatus } from '@/core/streams/sse'
import { STATUS_LABEL, STATUS_TONE } from '@/core/streams/status'

defineProps<{
  cardId: string
  exhibit: string
  title: string
  subtitle?: string
  stamp?: string
  status?: StreamStatus
}>()
</script>

<template>
  <article :data-card-id="cardId" class="card relative flex min-w-0 flex-col border border-line bg-surface p-5 sm:p-6">
    <header class="flex items-start justify-between gap-4">
      <p class="text-[11px] tracking-[0.18em] text-muted uppercase">Exhibit {{ exhibit }}</p>
      <p
        v-if="status"
        class="flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase"
        :class="STATUS_TONE[status]"
        role="status"
      >
        <span
          class="size-2 rounded-full bg-current"
          :class="{ 'motion-safe:animate-pulse': status === 'live' }"
          aria-hidden="true"
        />
        {{ STATUS_LABEL[status] }}
      </p>
      <span v-else-if="stamp" class="stamp">{{ stamp }}</span>
    </header>
    <h2 class="mt-3 font-serif text-3xl leading-tight">{{ title }}</h2>
    <p v-if="subtitle" class="mt-1 text-xs text-muted">{{ subtitle }}</p>
    <!-- A size container: widgets switch layout with `@xl:` variants on the width of their card.
         It is also a flex column, so a widget root with `flex-1` can absorb the slack of a stretched bento cell. -->
    <div class="@container mt-6 flex flex-1 flex-col">
      <slot />
    </div>
  </article>
</template>

<style scoped>
/* Cards stay perfectly upright: rotated text renders soft. Only the stamp tilts. */
.card {
  box-shadow: var(--card-shadow);
}

.stamp {
  border: 1.5px solid var(--signal);
  border-radius: 2px;
  padding: 1px 8px;
  color: var(--signal);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  transform: rotate(-3deg);
}
</style>
