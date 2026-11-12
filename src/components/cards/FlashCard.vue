<script setup lang="ts">
import { ref } from 'vue'

withDefaults(
  defineProps<{
    front: string
    backTitle?: string
    backLines?: string[]
    warn?: boolean
    tag?: string
  }>(),
  { backLines: () => [] },
)

const flipped = ref(false)
</script>

<template>
  <button
    type="button"
    class="flash"
    :class="{ 'is-flipped': flipped, 'is-warn': warn }"
    @click="flipped = !flipped"
  >
    <div class="flash__inner">
      <div class="flash__face flash__face--front">
        <span v-if="tag" class="flash__tag">{{ tag }}</span>
        <p class="flash__title">{{ front }}</p>
      </div>
      <div class="flash__face flash__face--back">
        <div class="flash__back-body">
          <p v-if="backTitle" class="flash__back-title">{{ backTitle }}</p>
          <p v-for="(line, i) in backLines" :key="i" class="flash__line">{{ line }}</p>
        </div>
      </div>
    </div>
  </button>
</template>

<style scoped lang="scss">
.flash {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1.05;
  border: none;
  background: transparent;
  perspective: 900px;
  cursor: pointer;
  padding: 0;
}

.flash__inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.45s ease;
  transform-style: preserve-3d;
}

.flash.is-flipped .flash__inner {
  transform: rotateY(180deg);
}

.flash__face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: var(--radius-card);
  padding: 0.85rem 0.9rem;
  background: #fffcf7;
  box-shadow: var(--shadow-warm);
  border: 1px solid rgba(210, 194, 175, 0.65);
  display: flex;
  flex-direction: column;
}

.flash__face--front {
  align-items: center;
  justify-content: center;
  text-align: center;
}

.flash__face--back {
  transform: rotateY(180deg);
  background: #f3ebe0;
  justify-content: center;
  text-align: left;
}

.flash__back-body {
  width: 100%;
}

.flash__title {
  font-family: var(--font-display);
  font-size: clamp(0.95rem, 2.4vw, 1.15rem);
  margin: 0;
  line-height: 1.3;
  text-align: center;
}

.flash__back-title {
  font-family: var(--font-display);
  font-size: clamp(0.9rem, 2.2vw, 1.05rem);
  margin: 0 0 0.35rem;
  line-height: 1.3;
  text-align: left;
}

.flash__line {
  margin: 0 0 0.25rem;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.35;
  text-align: left;
}

.flash__tag {
  position: absolute;
  top: 0.55rem;
  right: 0.55rem;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--ink-soft);
  background: rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  padding: 0.15rem 0.45rem;
}

.flash.is-warn .flash__face--front {
  border-color: color-mix(in srgb, var(--sticker-coral) 55%, #d2c2af);
}

@media (prefers-reduced-motion: reduce) {
  .flash__inner {
    transition: none;
  }
}
</style>
