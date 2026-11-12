<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router'
import { primaryNav } from '@/nav'

const route = useRoute()

function isActive(item: (typeof primaryNav)[number]) {
  return item.match ? item.match(route.path) : route.path === item.to
}
</script>

<template>
  <nav class="stickers" aria-label="Разделы дневника">
    <RouterLink
      v-for="item in primaryNav"
      :key="item.to"
      :to="item.to"
      class="sticker"
      :class="{ 'is-active': isActive(item) }"
      :style="{ '--tab': item.color }"
    >
      <span class="sticker__label">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped lang="scss">
.stickers {
  display: none;
}

@media (min-width: 900px) {
  .stickers {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.45rem;
    padding: 4.5rem 0 2rem;
    position: sticky;
    top: 0;
    height: 100dvh;
    z-index: 5;
  }

  .sticker {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 92px;
    padding: 0.85rem 0.4rem;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    text-decoration: none;
    color: var(--ink);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    border-radius: 12px 0 0 12px;
    background: color-mix(in srgb, var(--tab) 55%, white);
    box-shadow: var(--shadow-warm);
    border: 1px solid color-mix(in srgb, var(--tab) 35%, transparent);
    border-right: none;
    transition: transform 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease;
    margin-right: -2px;

    &:hover {
      filter: brightness(1.03);
      transform: rotate(180deg) translateY(-2px);
    }

    &.is-active {
      min-width: 52px;
      background: color-mix(in srgb, var(--tab) 72%, white);
      box-shadow: 0 10px 22px -10px rgba(90, 70, 50, 0.28);
      outline: 2px solid color-mix(in srgb, var(--tab) 50%, transparent);
      outline-offset: -2px;
    }
  }
}
</style>
