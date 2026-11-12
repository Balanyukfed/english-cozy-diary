<script setup lang="ts">
import { onMounted } from 'vue'
import { useData } from '@/composables/useData'

const { journal, meta, loadCore } = useData()

onMounted(() => {
  void loadCore()
})
</script>

<template>
  <section>
    <h1>Журнал</h1>
    <div v-if="journal" class="sheet-card block">
      <p><strong>Этап:</strong> {{ journal.stage }}</p>
      <p><strong>ДЗ:</strong> {{ journal.homework }}</p>
      <p v-if="meta">
        {{ meta.progressLessons }} / {{ meta.totalLessons }} · до {{ meta.deadline }}
      </p>
    </div>
    <div v-if="journal" class="sheet-card block">
      <h2>Сильные</h2>
      <ul>
        <li v-for="s in journal.strengths" :key="s">{{ s }}</li>
      </ul>
      <h2>Слабые</h2>
      <ul>
        <li v-for="w in journal.weaknesses" :key="w">{{ w }}</li>
      </ul>
    </div>
  </section>
</template>

<style scoped lang="scss">
.block {
  padding: 1rem 1.1rem;
  margin: 0.85rem 0;
}
ul {
  padding-left: 1.1rem;
}
</style>
