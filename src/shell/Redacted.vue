<script setup lang="ts">
import { reactive } from 'vue'

const entries = [
  'D · Solar interference',
  'E · Chatter',
]

const declassified = reactive(new Set<number>())

function toggle(index: number) {
  if (!declassified.delete(index)) declassified.add(index)
}
</script>

<template>
  <ul class="flex flex-col items-start gap-2.5">
    <li v-for="(entry, index) in entries" :key="entry">
      <button
        type="button"
        class="entry"
        :aria-pressed="declassified.has(index)"
        @click="toggle(index)"
      >
        {{ entry }}
        <span class="bar" aria-hidden="true" />
      </button>
    </li>
  </ul>
</template>

<style scoped>
.entry {
  position: relative;
  padding: 1px 8px;
  border: 0;
  background: none;
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.entry:focus-visible {
  outline: 2px solid var(--signal);
  outline-offset: 2px;
}

.bar {
  position: absolute;
  inset: 0;
  background: var(--redact);
  box-shadow: 0 0 0 1px var(--redact-edge);
  transition: opacity 0.25s;
}

.entry[aria-pressed='true'] .bar,
.entry:focus-visible .bar {
  opacity: 0;
}

@media (hover: hover) {
  .entry:hover .bar {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bar {
    transition: none;
  }
}
</style>
