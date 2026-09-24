<script setup lang="ts">
import { LATEST_COUNT } from './layout'

const PLACES = ['12 km SW of Hualien', 'Kermadec Islands', '8 km NNE of Ridgecrest']
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 @xl:grid @xl:grid-cols-2 @xl:grid-rows-[auto_auto_1fr] @xl:items-start @xl:gap-x-8" aria-hidden="true">
    <div class="@xl:col-start-2">
      <p class="metric text-ink"><span class="redacted">00</span></p>
      <p class="mt-2 caption text-muted">events · past 24 h</p>
    </div>

    <!-- The globe's place: a redacted disc in the same square. -->
    <div class="flex aspect-square w-full items-center justify-center @xl:col-start-1 @xl:row-span-3 @xl:row-start-1">
      <div class="size-[86%] rounded-full bg-ink/14" />
    </div>

    <p class="text-xs text-muted @xl:col-start-2">
      <span class="text-signal">●</span> <span class="redacted">0 in the last hour · strongest M 0.0</span>
      <br />
      Correlation with anything: none. Drag the globe.
    </p>

    <ol
      class="min-h-0 shrink basis-[7.25rem] grow divide-y divide-line overflow-hidden border-t border-line text-xs lg:[mask-image:linear-gradient(to_bottom,#000_calc(100%-2rem),transparent)] @xl:col-start-2 @xl:border-y @xl:[mask-image:none]"
    >
      <li v-for="i in LATEST_COUNT" :key="i" class="flex items-baseline gap-3 py-1.5 @xl:nth-[n+5]:hidden">
        <span class="w-9 shrink-0 text-ink"><span class="redacted">M 0.0</span></span>
        <span class="min-w-0 flex-1 truncate"><span class="redacted">{{ PLACES[i % PLACES.length] }}</span></span>
        <span class="shrink-0 label-micro text-muted"><span class="redacted">00 min</span></span>
      </li>
    </ol>
  </div>
</template>
