<script setup lang="ts">
import { STORY_COUNT } from './layout'

// Titles of the usual lengths, so on a phone about as many rows wrap as on the live front page.
const TITLES = [
  'Show HN: A tiny tool that does exactly one thing well',
  'The quiet death of a standard nobody noticed at all',
  'Why the old approach still wins, measured properly',
]
</script>

<template>
  <div class="flex flex-1 flex-col gap-4" aria-hidden="true">
    <div class="flex items-end gap-4">
      <p class="metric text-ink"><span class="redacted">0,000</span></p>
      <div class="min-w-0 pb-1">
        <p class="caption text-muted">comments · top {{ STORY_COUNT }}</p>
        <p class="mt-1 text-xs text-muted"><span class="redacted">Loudest thread: 000.</span></p>
      </div>
    </div>

    <ol
      class="min-h-0 shrink grow divide-y divide-line overflow-hidden border-y border-line text-xs lg:basis-32 lg:border-b-0 lg:[mask-image:linear-gradient(to_bottom,#000_calc(100%-2rem),transparent)]"
    >
      <li v-for="i in STORY_COUNT" :key="i" class="flex gap-3 py-2">
        <span class="w-4 shrink-0 text-right text-muted">{{ i }}</span>
        <div class="min-w-0 flex-1">
          <p class="line-clamp-2"><span class="redacted">{{ TITLES[i % TITLES.length] }}</span></p>
          <p class="mt-0.5 truncate text-[11px] text-muted"><span class="redacted">000 points · 00 comments</span></p>
        </div>
      </li>
    </ol>
  </div>
</template>
