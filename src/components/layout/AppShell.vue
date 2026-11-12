<script setup lang="ts">
import BottomNav from './BottomNav.vue'
import StickerNav from './StickerNav.vue'
</script>

<template>
  <div class="shell">
    <StickerNav />
    <div class="shell__stage">
      <div class="notebook">
        <div class="notebook__spine" aria-hidden="true" />
        <main class="shell__main">
          <slot />
        </main>
      </div>
    </div>
    <BottomNav />
  </div>
</template>

<style scoped lang="scss">
.shell {
  min-height: 100dvh;
  padding-bottom: calc(var(--nav-h) + var(--safe-bottom));
}

.shell__stage {
  width: min(920px, 100%);
  margin: 0 auto;
  padding: 0.85rem 0.75rem 1.25rem;
}

.notebook {
  position: relative;
  background: var(--sheet);
  border-radius: 22px;
  box-shadow: var(--shadow-page);
  border: 1px solid rgba(201, 184, 168, 0.55);
  min-height: calc(100dvh - var(--nav-h) - 2rem);
  overflow: hidden;
}

.notebook__spine {
  display: none;
}

.shell__main {
  position: relative;
  padding: 1.15rem 1rem 1.5rem 1.15rem;
}

@media (min-width: 900px) {
  .shell {
    display: grid;
    grid-template-columns: 112px minmax(0, 1fr);
    gap: 0;
    padding-bottom: 1.5rem;
    width: min(1100px, calc(100% - 2rem));
    margin: 0 auto;
  }

  .shell__stage {
    width: 100%;
    padding: 1.25rem 1rem 1.5rem 0;
  }

  .notebook {
    min-height: calc(100dvh - 2.5rem);
  }

  .notebook__spine {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 18px;
    background: linear-gradient(
      90deg,
      rgba(90, 70, 50, 0.08),
      rgba(255, 255, 255, 0.2) 40%,
      transparent
    );
    border-right: 1px solid rgba(201, 184, 168, 0.35);
  }

  .shell__main {
    padding: 1.5rem 1.75rem 1.75rem 1.85rem;
  }
}
</style>
