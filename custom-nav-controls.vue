<script setup lang="ts">
import { slideLocale, toggleSlideLocale } from './lib/locale'
</script>

<template>
  <button
    class="slidev-icon-btn locale-btn"
    :title="`Idioma / Language: ${slideLocale.toUpperCase()} (press L)`"
    @click="toggleSlideLocale()"
  >
    <span class="locale-code">{{ slideLocale.toUpperCase() }}</span>
  </button>
</template>

<style scoped>
.locale-code {
  font-family: 'Geist Mono Variable', ui-monospace, monospace;
  font-size: 11px;
  font-variation-settings: 'wght' 600;
  letter-spacing: 0.04em;
}
</style>
