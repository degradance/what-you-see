<template>
  <!-- The bars are hidden from screen readers; this line says in words what they stand for. -->
  <div class="flex flex-1 flex-col" aria-busy="true">
    <p class="sr-only" role="status">Decrypting signal…</p>
    <slot />
  </div>
</template>
