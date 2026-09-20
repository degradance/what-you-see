<script setup lang="ts">
import Board from './shell/Board.vue'
import ThemeToggle from './shell/ThemeToggle.vue'
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-8 sm:py-12">
    <header class="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="text-[11px] tracking-[0.18em] text-signal uppercase">
          Case file № 001 · Status: open
        </p>
        <h1 class="mt-3 font-serif text-6xl leading-[0.95] sm:text-8xl">
          What you see<span class="text-signal italic">?</span>
        </h1>
        <p class="mt-4 max-w-xl font-serif text-xl text-muted italic sm:text-2xl">
          Everything is live. Nothing is a coincidence.
        </p>
      </div>
      <ThemeToggle />
    </header>

    <main class="mt-12 flex-1">
      <Board />
    </main>

    <footer class="mt-16 border-t border-line pt-4 text-xs text-muted">
      All data is public and real. All connections are made up.
    </footer>
  </div>
</template>
