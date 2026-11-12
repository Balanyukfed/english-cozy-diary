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
      <span class="sticker__label">{{ item.short }}</span>
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
    gap: 0.35rem;
    padding: 4rem 0 2rem;
    position: sticky;
    top: 0;
    height: 100dvh;
    z-index: 5;
  }

  .sticker {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 96px;
    min-height: 36px;
    height: 36px;
    padding: 0 0.55rem 0 0.7rem;
    text-decoration: none;
    color: var(--ink);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    border-radius: 8px 0 0 8px;
    background:
      linear-gradient(
        90deg,
        color-mix(in srgb, var(--tab) 80%, white) 0%,
        color-mix(in srgb, var(--tab) 58%, white) 100%
      );
    box-shadow:
      -2px 2px 7px -4px rgba(90, 70, 50, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.35);
    border: 1px solid color-mix(in srgb, var(--tab) 40%, rgba(120, 100, 80, 0.25));
    border-right: none;
    transition: width 0.15s ease, filter 0.15s ease;
    white-space: nowrap;

    &:hover {
      filter: brightness(1.03);
      width: 104px;
    }

    &.is-active {
      width: 112px;
      background:
        linear-gradient(
          90deg,
          color-mix(in srgb, var(--tab) 90%, white) 0%,
          color-mix(in srgb, var(--tab) 66%, white) 100%
        );
      box-shadow:
        -3px 3px 10px -4px rgba(90, 70, 50, 0.28),
        inset 0 1px 0 rgba(255, 255, 255, 0.4);
    }
  }

  .sticker__label {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
