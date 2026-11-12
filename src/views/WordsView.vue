<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useData } from '@/composables/useData'
import FlashCard from '@/components/cards/FlashCard.vue'

const { vocab, loadCore } = useData()
const onlyWarn = ref(false)

onMounted(() => {
  void loadCore()
})

const cards = computed(() => {
  const all = vocab.value?.[0]?.cards ?? []
  return onlyWarn.value ? all.filter((c) => c.warn) : all
})
</script>

<template>
  <section>
    <header class="head">
      <h1>Слова</h1>
      <label class="toggle">
        <input v-model="onlyWarn" type="checkbox" />
        Только повтор
      </label>
    </header>
    <div class="card-grid">
      <FlashCard
        v-for="c in cards"
        :key="c.id"
        :front="c.en"
        :back-title="c.ru"
        :back-lines="c.example ? [c.example] : []"
        :warn="c.warn"
        :tag="c.warn ? 'повтор' : undefined"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 44px;
  color: var(--ink-soft);
  font-size: 0.9rem;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

@media (min-width: 640px) {
  .card-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .card-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.85rem;
  }
}
</style>
