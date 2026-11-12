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
      <div class="flash__face flash__face--back" aria-hidden="true">
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
  max-width: 100%;
  border: none;
  background: transparent;
  perspective: 900px;
  -webkit-perspective: 900px;
  cursor: pointer;
  padding: 0;
  text-align: inherit;
  /* WebKit columns: keep card as one unbreakable unit */
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
  page-break-inside: avoid;
}

.flash__inner {
  position: relative;
  width: 100%;
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
  transition: transform 0.45s ease;
}

.flash.is-flipped .flash__inner {
  transform: rotateY(180deg);
  -webkit-transform: rotateY(180deg);
}

.flash__face {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 12px;
  padding: 0.55rem 0.65rem;
  min-height: 3.4rem;
  background: #fffcf7;
  box-shadow: var(--shadow-warm);
  border: 1px solid rgba(210, 194, 175, 0.65);
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
}

.flash__face--front {
  position: relative;
  align-items: center;
  text-align: center;
}

.flash__face--back {
  position: absolute;
  inset: 0;
  transform: rotateY(180deg);
  -webkit-transform: rotateY(180deg);
  background: #f3ebe0;
  justify-content: center;
  text-align: left;
  overflow: auto;
}

.flash__back-body {
  width: 100%;
}

.flash__title {
  font-family: var(--font-display);
  font-size: 0.92rem;
  margin: 0;
  line-height: 1.25;
  text-align: center;
  word-break: break-word;
}

.flash__back-title {
  font-family: var(--font-display);
  font-size: 0.9rem;
  margin: 0 0 0.2rem;
  line-height: 1.25;
  text-align: left;
  word-break: break-word;
}

.flash__line {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.75rem;
  line-height: 1.3;
  text-align: left;
  word-break: break-word;
}

.flash__tag {
  position: absolute;
  top: 0.35rem;
  right: 0.4rem;
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--ink-soft);
  background: rgba(255, 255, 255, 0.75);
  border-radius: 999px;
  padding: 0.1rem 0.35rem;
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
