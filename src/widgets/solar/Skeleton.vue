<script setup lang="ts">
// Placeholders as long as the real values, which wrap in the three-column row of a mid-width card.
const TERMS = [
  ['Latest reading', 'Mon 00:00 UTC'],
  ['Peak this week', 'Kp 0.00 · Mon 00:00 UTC'],
  ['Storm readings', '00 of 00'],
]
// A week of three-hour readings, as a silhouette of heights in percent.
const BARS = [30, 22, 35, 45, 28, 20, 38, 52, 40, 26, 33, 48, 30, 24, 42, 36, 27, 50, 34, 22, 30, 44, 38, 28]
</script>

<template>
  <div class="flex flex-col gap-5" aria-hidden="true">
    <div class="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
      <div>
        <p class="metric text-ink"><span class="redacted">0.00</span></p>
        <p class="mt-2 caption text-muted">Kp index · <span class="redacted">quiet</span></p>
      </div>
      <p class="min-h-8 max-w-64 text-xs text-muted"><span class="redacted">The Sun is being suspiciously calm.</span></p>
    </div>

    <div>
      <div class="flex h-32 items-end gap-0.5">
        <div v-for="(height, i) in BARS" :key="i" class="flex-1 bg-ink/14" :style="{ height: `${height}%` }" />
      </div>
      <div class="mt-1 h-4" />
    </div>

    <dl class="grid divide-y divide-line border-y border-line text-xs @xl:grid-cols-3 @xl:divide-x @xl:divide-y-0">
      <div
        v-for="[term, value] in TERMS"
        :key="term"
        class="flex items-baseline justify-between gap-3 py-1.5 @xl:flex-col @xl:items-start @xl:gap-1 @xl:px-4 @xl:first:pl-0"
      >
        <dt class="label-micro text-muted">{{ term }}</dt>
        <dd><span class="redacted">{{ value }}</span></dd>
      </div>
    </dl>
  </div>
</template>
