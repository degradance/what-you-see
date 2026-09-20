<script setup lang="ts">
import Board from './shell/Board.vue'
import Clock from './shell/Clock.vue'
import ThemeToggle from './shell/ThemeToggle.vue'
import Typewriter from './shell/Typewriter.vue'
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-8 sm:py-12">
    <header class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] tracking-[0.18em] uppercase">
          <span class="text-signal">Case file № 001</span>
          <span class="text-muted">Status: open</span>
          <span class="text-muted">Clearance: public</span>
          <Clock class="text-muted" />
        </p>
        <h1 class="mt-3 font-serif text-6xl leading-[0.95] sm:text-8xl">
          What you see<span class="text-signal italic">?</span>
        </h1>
        <Typewriter
          class="mt-4 block max-w-xl font-serif text-xl text-muted italic sm:text-2xl"
          text="Everything is live. Nothing is a coincidence."
        />
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
