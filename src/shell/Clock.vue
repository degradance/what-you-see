<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const now = ref(new Date())
const iso = computed(() => now.value.toISOString())
const time = computed(() => iso.value.slice(11, 19))

let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  timer = setInterval(() => (now.value = new Date()), 1000)
})

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <time class="tabular-nums" :datetime="iso" aria-hidden="true">UTC {{ time }}</time>
</template>
