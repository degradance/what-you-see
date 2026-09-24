<script setup lang="ts">
const TERMS = ['Latitude', 'Longitude', 'Altitude', 'Sunlight']
</script>

<template>
  <div class="flex flex-col gap-4 @xl:grid @xl:grid-cols-2 @xl:grid-rows-[auto_auto_1fr] @xl:items-start @xl:gap-x-8" aria-hidden="true">
    <div class="@xl:col-start-2">
      <p class="metric text-ink"><span class="redacted">00,000</span></p>
      <p class="mt-2 caption text-muted">km/h · orbital speed</p>
    </div>

    <!-- The globe's place: a redacted disc in the same square. -->
    <div class="flex aspect-square w-full items-center justify-center @xl:col-start-1 @xl:row-span-3 @xl:row-start-1">
      <div class="size-[86%] rounded-full bg-ink/14" />
    </div>

    <p class="text-xs text-muted @xl:col-start-2">
      Field of view: <span class="redacted">0,000</span> km wide.
      <br />
      Currently observing: everyone in it. Drag to look away.
    </p>

    <dl class="divide-y divide-line border-y border-line text-xs @xl:col-start-2">
      <div v-for="term in TERMS" :key="term" class="flex items-baseline justify-between gap-3 py-1.5">
        <dt class="label-micro text-muted">{{ term }}</dt>
        <dd><span class="redacted">00.00° N</span></dd>
      </div>
    </dl>
  </div>
</template>
