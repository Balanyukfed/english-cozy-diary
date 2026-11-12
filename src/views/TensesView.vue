<script setup lang="ts">
import { onMounted } from 'vue'
import { useData } from '@/composables/useData'
import FlashCard from '@/components/cards/FlashCard.vue'

const { tenses, loadCore } = useData()

onMounted(() => {
  void loadCore()
})
</script>

<template>
  <section>
    <header class="head">
      <h1>Грамматика</h1>
    </header>
    <div class="card-grid">
      <FlashCard
        v-for="t in tenses ?? []"
        :key="t.id"
        :front="t.title"
        :back-title="t.formula"
        :back-lines="[...t.examples.slice(0, 2), `Не так: ${t.mistake}`]"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
.head {
  margin-bottom: 1rem;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

@media (min-width: 720px) {
  .card-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.85rem;
  }
}
</style>
