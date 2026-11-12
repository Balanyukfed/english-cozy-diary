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
  column-count: 2;
  column-gap: 0.55rem;
}

.card-grid :deep(.flash) {
  break-inside: avoid;
  margin: 0 0 0.55rem;
}

@media (min-width: 720px) {
  .card-grid {
    column-count: 3;
    column-gap: 0.65rem;
  }
}
</style>
