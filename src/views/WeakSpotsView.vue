<script setup lang="ts">
import { onMounted } from 'vue'
import { useData } from '@/composables/useData'

const { weakSpots, loadCore } = useData()

onMounted(() => {
  void loadCore()
})

const label: Record<string, string> = {
  high: 'срочно',
  medium: 'важно',
  low: 'следить',
  done: 'закрыто',
}
</script>

<template>
  <section>
    <h1>Хромает</h1>
    <article
      v-for="w in weakSpots ?? []"
      :key="w.id"
      class="sheet-card item"
      :data-priority="w.priority"
    >
      <p class="tag">{{ label[w.priority] }}</p>
      <h2>{{ w.topic }}</h2>
      <p>{{ w.why }}</p>
      <p class="note-pencil">{{ w.plan }}</p>
    </article>
  </section>
</template>

<style scoped lang="scss">
.item {
  padding: 1rem 1.1rem;
  margin: 0.75rem 0;
}

.tag {
  display: inline-block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--sticker-coral);
  margin-bottom: 0.25rem;
}

.item[data-priority='high'] {
  border-color: rgba(196, 122, 106, 0.55);
}
</style>
