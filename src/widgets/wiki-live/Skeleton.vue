<script setup lang="ts">
import { FEED_SIZE, RATE_WINDOW_S } from './layout'

// Placeholder words of the usual length, blacked out: each row is as wide and tall as a real edit.
const ROWS = ['Q124512207', 'Sonnenfinsternis 2026', 'File:Harbour at dusk.jpg', 'Tour Eiffel', 'Category:Lighthouses']
</script>

<template>
  <div class="flex flex-col gap-5" aria-hidden="true">
    <div>
      <p class="metric text-ink"><span class="redacted">00.0</span></p>
      <p class="mt-2 caption text-muted">edits per second · {{ RATE_WINDOW_S }} s average</p>
    </div>

    <div>
      <div class="h-1.5 rounded-full bg-line" />
      <p class="mt-2 text-xs text-muted"><span class="redacted">00% humans · 00% bots</span></p>
    </div>

    <ol class="divide-y divide-line border-y border-line text-xs">
      <li v-for="i in FEED_SIZE" :key="i" class="flex items-baseline gap-3 py-1.5">
        <span class="w-36 shrink-0 truncate text-muted"><span class="redacted">xx.wikipedia.org</span></span>
        <span class="min-w-0 flex-1 truncate"><span class="redacted">{{ ROWS[i % ROWS.length] }}</span></span>
        <span class="shrink-0 label-micro text-muted"><span class="redacted">edit</span></span>
      </li>
    </ol>
  </div>
</template>
