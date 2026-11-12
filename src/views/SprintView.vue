<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useData } from '@/composables/useData'

const { sprint, loadCore } = useData()

onMounted(() => {
  void loadCore()
})
</script>

<template>
  <section>
    <h1>Схема</h1>
    <div v-for="block in sprint ?? []" :key="block.id" class="block sheet-card">
      <h2>{{ block.id }}. {{ block.title }}</h2>
      <ul>
        <li
          v-for="l in block.lessons"
          :key="l.id"
          :class="[`is-${l.status}`]"
        >
          <RouterLink v-if="l.id === 'S1' || l.status !== 'todo'" :to="`/diary?lesson=${l.id}`">
            {{ l.id }} — {{ l.title }}
          </RouterLink>
          <span v-else>{{ l.id }} — {{ l.title }}</span>
        </li>
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
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
}

li {
  padding: 0.45rem 0;
  border-bottom: 1px dashed rgba(201, 184, 168, 0.55);
  color: var(--ink-soft);

  &.is-current {
    color: var(--ink);
    font-weight: 700;
  }

  &.is-done {
    color: var(--ok);
  }

  a {
    text-decoration: none;
    color: inherit;
  }
}
</style>
