<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { pollTask } from '@/core/streams/poll'
import type { StreamStatus } from '@/core/streams/sse'
import { loadFrontPage } from './api'
import type { Story } from './schema'
import Skeleton from './Skeleton.vue'
import { busiest, discussionUrl, formatComments, formatPoints, totalComments } from './stories'

// The card header shows the connection state, so the widget only reports it.
const emit = defineEmits<{ status: [status: StreamStatus] }>()

// The front page reshuffles over minutes, not seconds, and each round costs seven requests.
const POLL_MS = 2 * 60_000

const LINK = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal'

const stories = shallowRef<Story[]>([])

const total = computed(() => totalComments(stories.value))
const loudest = computed(() => busiest(stories.value))

let stopPolling: (() => void) | undefined

onMounted(() => {
  stopPolling = pollTask({
    load: (signal) => loadFrontPage({ signal }),
    intervalMs: POLL_MS,
    onData: (next) => (stories.value = next),
    onStatus: (s) => emit('status', s),
  })
})

onBeforeUnmount(() => stopPolling?.())
</script>

<template>
  <Skeleton v-if="stories.length === 0" />
  <div v-else class="flex flex-1 flex-col gap-4 motion-safe:declassify">
    <div class="flex items-end gap-4">
      <p class="metric text-ink">
        {{ total.toLocaleString('en-US') }}
      </p>
      <div class="min-w-0 pb-1">
        <p class="caption text-muted">comments · top {{ stories.length }}</p>
        <p v-if="loudest" class="mt-1 text-xs text-muted">Loudest thread: {{ loudest.comments.toLocaleString('en-US') }}.</p>
      </div>
    </div>

    <!-- On the board the list grows from a small basis into the spare height of its cell and fades out at the bottom;
         `flex-1` would size the column by all rows. On a phone the card is as tall as its content, so every row shows. -->
    <ol
      class="min-h-0 shrink grow divide-y divide-line overflow-hidden border-y border-line text-xs lg:basis-32 lg:border-b-0 lg:[mask-image:linear-gradient(to_bottom,#000_calc(100%-2rem),transparent)]"
    >
      <li v-for="(story, index) in stories" :key="story.id" class="flex gap-3 py-2">
        <span class="w-4 shrink-0 text-right text-muted" aria-hidden="true">{{ index + 1 }}</span>
        <div class="min-w-0 flex-1">
          <a
            :href="story.url ?? discussionUrl(story.id)"
            :class="LINK"
            class="line-clamp-2 text-ink hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ story.title }}
          </a>
          <p class="mt-0.5 truncate text-[11px] text-muted">
            {{ formatPoints(story.score) }} ·
            <a :href="discussionUrl(story.id)" :class="LINK" class="hover:underline" target="_blank" rel="noopener noreferrer">
              {{ formatComments(story.comments) }}
            </a>
            <template v-if="story.host"> · {{ story.host }}</template>
          </p>
        </div>
      </li>
    </ol>
  </div>
</template>
