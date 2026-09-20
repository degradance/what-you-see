<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from './useTheme'

const { theme, toggle } = useTheme()
const isDark = computed(() => theme.value === 'dark')
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="!isDark"
    aria-label="Declassified mode"
    class="inline-flex shrink-0 cursor-pointer items-center gap-3 self-start rounded-full border border-line bg-surface px-4 py-2 text-[11px] tracking-[0.18em] uppercase transition-colors hover:border-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal motion-reduce:transition-none"
    @click="toggle"
  >
    <span :class="isDark ? 'text-signal' : 'text-muted'">Redacted</span>
    <span aria-hidden="true" class="relative h-4 w-8 rounded-full border border-line bg-canvas">
      <span
        class="absolute top-0.5 size-2.5 rounded-full bg-signal transition-[left] motion-reduce:transition-none"
        :class="isDark ? 'left-0.5' : 'left-[18px]'"
      />
    </span>
    <span :class="isDark ? 'text-muted' : 'text-signal'">Declassified</span>
  </button>
</template>
