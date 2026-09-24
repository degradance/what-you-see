<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from './useTheme'

const { theme, toggle } = useTheme()
const isDark = computed(() => theme.value === 'dark')
</script>

<template>
  <!-- In the bar only the current mode is named, and on a phone only the switch shows; the accessible name stays whole. -->
  <button
    type="button"
    role="switch"
    :aria-checked="!isDark"
    aria-label="Declassified mode"
    :title="isDark ? 'Redacted · switch to Declassified' : 'Declassified · switch to Redacted'"
    class="inline-flex h-8 shrink-0 cursor-pointer items-center gap-3 rounded-full border border-line bg-canvas px-3 text-[11px] tracking-[0.18em] text-signal uppercase transition-colors hover:border-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal motion-reduce:transition-none"
    @click="toggle"
  >
    <span class="hidden sm:inline" aria-hidden="true">{{ isDark ? 'Redacted' : 'Declassified' }}</span>
    <span aria-hidden="true" class="relative h-4 w-8 rounded-full border border-line bg-surface">
      <span
        class="absolute top-0.5 size-2.5 rounded-full bg-signal transition-[left] motion-reduce:transition-none"
        :class="isDark ? 'left-0.5' : 'left-[18px]'"
      />
    </span>
  </button>
</template>
