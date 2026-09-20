<script setup lang="ts">
defineProps<{
  exhibit: string
  title: string
  subtitle?: string
  stamp?: string
}>()
</script>

<template>
  <article class="card relative border border-line bg-surface p-5 pt-6 sm:p-6 sm:pt-7">
    <span class="pin" aria-hidden="true" />
    <header class="flex items-start justify-between gap-4">
      <p class="text-[11px] tracking-[0.18em] text-muted uppercase">Exhibit {{ exhibit }}</p>
      <span v-if="stamp" class="stamp">{{ stamp }}</span>
    </header>
    <h2 class="mt-3 font-serif text-3xl leading-tight">{{ title }}</h2>
    <p v-if="subtitle" class="mt-1 text-xs text-muted">{{ subtitle }}</p>
    <div class="mt-6">
      <slot />
    </div>
  </article>
</template>

<style scoped>
/* Cards stay perfectly upright: rotated text renders soft. Only the ornaments tilt. */
.card {
  box-shadow: var(--card-shadow);
}

.pin {
  position: absolute;
  top: -7px;
  left: 24px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--signal);
  box-shadow:
    inset -2px -2px 3px rgb(0 0 0 / 0.35),
    0 2px 4px rgb(0 0 0 / 0.5);
}

.stamp {
  border: 1.5px solid var(--signal);
  border-radius: 2px;
  padding: 1px 8px;
  color: var(--signal);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  transform: rotate(-3deg);
}
</style>
