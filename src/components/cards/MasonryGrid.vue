<script setup lang="ts" generic="T">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    items: T[]
    getKey: (item: T) => string | number
  }>(),
  {},
)

const root = ref<HTMLElement | null>(null)
const colCount = ref(2)

function measure() {
  const w = root.value?.clientWidth ?? 0
  if (w >= 1040) colCount.value = 4
  else if (w >= 700) colCount.value = 3
  else colCount.value = 2
}

const columns = computed(() => {
  const n = Math.max(2, colCount.value)
  const cols: T[][] = Array.from({ length: n }, () => [])
  props.items.forEach((item, i) => {
    cols[i % n].push(item)
  })
  return cols
})

let ro: ResizeObserver | null = null

onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined' && root.value) {
    ro = new ResizeObserver(() => measure())
    ro.observe(root.value)
  } else {
    window.addEventListener('resize', measure)
  }
})

onBeforeUnmount(() => {
  ro?.disconnect()
  window.removeEventListener('resize', measure)
})
</script>

<template>
  <div ref="root" class="masonry" :style="{ '--cols': colCount }">
    <div v-for="(col, ci) in columns" :key="ci" class="masonry__col">
      <div v-for="item in col" :key="getKey(item)" class="masonry__item">
        <slot :item="item" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.masonry {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  width: 100%;
  max-width: 100%;
}

.masonry__col {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.masonry__item {
  width: 100%;
}

@media (min-width: 720px) {
  .masonry {
    gap: 0.65rem;
  }

  .masonry__col {
    gap: 0.65rem;
  }
}
</style>
