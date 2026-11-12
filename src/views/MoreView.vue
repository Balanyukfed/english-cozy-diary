<script setup lang="ts">
import { RouterLink } from 'vue-router'

const links = [
  { to: '/sprint', label: 'Схема спринта', color: 'var(--sticker-moss)' },
  { to: '/journal', label: 'Журнал', color: 'var(--sticker-lilac)' },
  { to: '/weak', label: 'Хромает', color: 'var(--sticker-coral)' },
  { to: '/help', label: 'Справка', color: 'var(--sticker-sage)' },
]
</script>

<template>
  <section>
    <h1>Ещё</h1>
    <RouterLink
      v-for="l in links"
      :key="l.to"
      :to="l.to"
      class="link sheet-card"
      :style="{ '--c': l.color }"
    >
      <span class="dot" />
      {{ l.label }}
    </RouterLink>
  </section>
</template>

<style scoped lang="scss">
.link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
  margin: 0.65rem 0;
  text-decoration: none;
  color: var(--ink);
  font-weight: 600;
  min-height: 56px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--c);
}
</style>
