<script setup lang="ts">
import { caseNumber } from '@/core/case-number'
import Board from './shell/Board.vue'
import Clock from './shell/Clock.vue'
import NavBar from './shell/NavBar.vue'
import Typewriter from './shell/Typewriter.vue'

// Every visit opens a different case; the number is drawn once, so it never changes under the reader.
const fileNumber = caseNumber()
</script>

<template>
  <a
    href="#board"
    class="sr-only z-50 bg-signal px-4 py-2 text-canvas focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    >Skip to the board</a
  >
  <NavBar :file-number="fileNumber" />
  <!-- The bar sits at the bottom on a phone and at the top from `sm`; the page leaves room on that side. -->
  <div class="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pt-8 pb-20 sm:px-8 sm:pt-24 sm:pb-12">
    <header>
      <div>
        <p class="flex flex-wrap items-center gap-x-4 gap-y-1 label">
          <span class="text-signal">Case file № {{ fileNumber }}</span>
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
    </header>

    <main class="mt-12 flex-1">
      <Board />
    </main>

    <footer class="mt-16 border-t border-line pt-4 text-xs text-muted">
      All data is public and real. All connections are made up.
    </footer>
  </div>
</template>
