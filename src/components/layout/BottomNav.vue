<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router'
import { mobileNav } from '@/nav'

const route = useRoute()

function isActive(item: (typeof mobileNav)[number]) {
  return item.match ? item.match(route.path) : route.path === item.to
}
</script>

<template>
  <nav class="nav" aria-label="Основное меню">
    <RouterLink
      v-for="item in mobileNav"
      :key="item.to"
      :to="item.to"
      class="nav__item"
      :class="{ 'is-active': isActive(item) }"
      :style="{ '--tab': item.color }"
    >
      <span class="nav__tab" />
      <span>{{ item.short }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped lang="scss">
.nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.25rem;
  padding: 0.4rem 0.4rem calc(0.4rem + var(--safe-bottom));
  background: color-mix(in srgb, var(--sheet) 88%, white);
  backdrop-filter: blur(14px);
  border-top: 1px solid rgba(201, 184, 168, 0.55);
}

.nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  min-height: 54px;
  text-decoration: none;
  color: var(--ink-soft);
  font-size: 0.7rem;
  font-weight: 650;
  border-radius: 14px;
}

.nav__tab {
  width: 22px;
  height: 10px;
  border-radius: 4px 4px 2px 2px;
  background: color-mix(in srgb, var(--tab) 70%, white);
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.06);
}

.nav__item.is-active {
  color: var(--ink);
  background: rgba(255, 255, 255, 0.55);

  .nav__tab {
    background: var(--tab);
    box-shadow: 0 2px 6px color-mix(in srgb, var(--tab) 35%, transparent);
  }
}

@media (min-width: 900px) {
  .nav {
    display: none;
  }
}
</style>
