<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{ text: string; delay?: number; interval?: number }>(), {
  delay: 600,
  interval: 45,
})

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const count = ref(reducedMotion ? props.text.length : 0)
const caretVisible = ref(!reducedMotion)
const typed = computed(() => props.text.slice(0, count.value))
const rest = computed(() => props.text.slice(count.value))

let timer: ReturnType<typeof setTimeout> | undefined

function step() {
  count.value++
  if (count.value < props.text.length) {
    timer = setTimeout(step, props.interval)
  } else {
    timer = setTimeout(() => (caretVisible.value = false), 1500)
  }
}

onMounted(() => {
  if (!reducedMotion) timer = setTimeout(step, props.delay)
})

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <span>
    <span class="sr-only">{{ text }}</span>
    <span aria-hidden="true">{{ typed }}<span class="caret" :class="{ hidden: !caretVisible }" /><span class="invisible">{{ rest }}</span></span>
  </span>
</template>

<style scoped>
/* The untyped rest stays in the layout (invisible), so wrapping never shifts while typing. */
.caret {
  position: relative;
  display: inline-block;
  width: 0;
  height: 1em;
  vertical-align: text-bottom;
}

.caret::after {
  content: '';
  position: absolute;
  top: 0.1em;
  bottom: 0.05em;
  left: 1px;
  width: 2px;
  background: var(--signal);
}

@media (prefers-reduced-motion: no-preference) {
  .caret::after {
    animation: blink 1s steps(1) infinite;
  }
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
