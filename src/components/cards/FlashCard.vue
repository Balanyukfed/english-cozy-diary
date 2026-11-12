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
    <div class="flash__stage">
      <div class="flash__face flash__face--front">
        <span v-if="tag" class="flash__tag">{{ tag }}</span>
        <p class="flash__title">{{ front }}</p>
      </div>
      <div class="flash__face flash__face--back" aria-hidden="true">
        <p v-if="backTitle" class="flash__back-title">{{ backTitle }}</p>
        <p v-for="(line, i) in backLines" :key="i" class="flash__line">{{ line }}</p>
      </div>
    </div>
  </button>
</template>

<style scoped lang="scss">
.flash {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  text-align: inherit;
  -webkit-tap-highlight-color: transparent;
}

.flash__stage {
  position: relative;
  width: 100%;
}

.flash__face {
  width: 100%;
  box-sizing: border-box;
  border-radius: 12px;
  padding: 0.65rem 0.7rem;
  min-height: 3.5rem;
  background: #fffcf7;
  box-shadow: var(--shadow-warm);
  border: 1px solid rgba(210, 194, 175, 0.65);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.25rem;
}

.flash__face--front {
  align-items: stretch;
  text-align: center;
}

.flash__face--back {
  display: none;
  align-items: flex-start;
  text-align: left;
  background: #f3ebe0;
}

.flash.is-flipped .flash__face--front {
  display: none;
}

.flash.is-flipped .flash__face--back {
  display: flex;
}

.flash__tag {
  align-self: flex-end;
  font-size: 0.62rem;
  font-weight: 700;
  line-height: 1;
  color: var(--ink-soft);
  background: rgba(255, 255, 255, 0.85);
  border-radius: 999px;
  padding: 0.18rem 0.4rem;
  margin: -0.15rem -0.1rem 0.1rem 0;
}

.flash__title {
  font-family: var(--font-display);
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.3;
  text-align: center;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.flash__back-title {
  font-family: var(--font-display);
  font-size: 0.88rem;
  margin: 0;
  line-height: 1.3;
  text-align: left;
  overflow-wrap: anywhere;
}

.flash__line {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.75rem;
  line-height: 1.35;
  text-align: left;
  overflow-wrap: anywhere;
}

.flash.is-warn .flash__face--front {
  border-color: color-mix(in srgb, var(--sticker-coral) 55%, #d2c2af);
}
</style>
