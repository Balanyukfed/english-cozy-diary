<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useData } from '@/composables/useData'
import FlashCard from '@/components/cards/FlashCard.vue'
import MasonryGrid from '@/components/cards/MasonryGrid.vue'
import type { GrammarSection, TenseCard } from '@/types'

type Filter = 'all' | GrammarSection

const { tenses, sprint, loadCore } = useData()
const filter = ref<Filter>('all')

onMounted(() => {
  void loadCore()
})

const lessonRank = computed(() => {
  const order =
    sprint.value?.flatMap((b) => b.lessons.map((l) => l.id)) ??
    Array.from({ length: 48 }, (_, i) => `S${i + 1}`)
  const unlocked = new Set(
    (sprint.value?.flatMap((b) => b.lessons) ?? [])
      .filter((l) => l.status === 'done' || l.status === 'current')
      .map((l) => l.id),
  )
  let max = -1
  order.forEach((id, i) => {
    if (unlocked.has(id)) max = Math.max(max, i)
  })
  return { order, max }
})

function isOpen(card: TenseCard) {
  const idx = lessonRank.value.order.indexOf(card.unlockedBy)
  if (idx === -1) return false
  return idx <= lessonRank.value.max
}

const openCards = computed(() => (tenses.value ?? []).filter(isOpen))
const lockedCards = computed(() => (tenses.value ?? []).filter((c) => !isOpen(c)))

const visibleOpen = computed(() => {
  if (filter.value === 'all') return openCards.value
  return openCards.value.filter((c) => c.section === filter.value)
})

const visibleLocked = computed(() => {
  if (filter.value === 'all') return lockedCards.value
  return lockedCards.value.filter((c) => c.section === filter.value)
})

const tabs: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Всё' },
  { id: 'tenses', label: 'Времена' },
  { id: 'structure', label: 'Структура' },
]

function cardKey(c: TenseCard) {
  return c.id
}
</script>

<template>
  <section class="grammar">
    <header class="head">
      <h1>Грамматика</h1>
      <p class="hint">
        Открывается по мере уроков. Вкладки: времена (Present Simple…) и структура (порядок слов,
        артикли, предлоги…).
      </p>
    </header>

    <div class="tabs no-swipe" role="tablist">
      <button
        v-for="t in tabs"
        :key="t.id"
        type="button"
        class="tabs__btn"
        :class="{ 'is-active': filter === t.id }"
        @click="filter = t.id"
      >
        {{ t.label }}
      </button>
    </div>

    <section v-if="visibleOpen.length" class="block">
      <h2 class="block__title">Изучено</h2>
      <MasonryGrid :items="visibleOpen" :get-key="cardKey">
        <template #default="{ item: c }">
          <FlashCard
            :front="c.title"
            :back-title="c.formula"
            :back-lines="[...c.examples.slice(0, 2), `Не так: ${c.mistake}`]"
            :tag="c.section === 'tenses' ? 'время' : 'структура'"
          />
        </template>
      </MasonryGrid>
    </section>

    <section v-if="visibleLocked.length" class="block block--locked">
      <h2 class="block__title">Ещё впереди</h2>
      <ul class="locked-list">
        <li v-for="c in visibleLocked" :key="c.id" class="locked">
          <span class="locked__title">{{ c.title }}</span>
          <span class="locked__meta">после {{ c.unlockedBy }}</span>
        </li>
      </ul>
    </section>

    <p v-if="!visibleOpen.length && !visibleLocked.length" class="hint">Пока пусто.</p>
  </section>
</template>

<style scoped lang="scss">
.head {
  margin-bottom: 0.75rem;
}

.hint {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--ink-soft);
  line-height: 1.45;
}

.tabs {
  display: flex;
  gap: 0.3rem;
  margin-bottom: 1rem;
  padding: 0.2rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.35);
  border: 1px solid rgba(201, 184, 168, 0.55);
}

.tabs__btn {
  flex: 1;
  min-height: 38px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: var(--ink-soft);
  font: inherit;
  font-size: 0.84rem;
  font-weight: 650;
  cursor: pointer;

  &.is-active {
    background: rgba(255, 252, 245, 0.95);
    color: var(--ink);
    box-shadow: 0 1px 4px rgba(90, 70, 50, 0.1);
  }
}

.block {
  margin-bottom: 1.25rem;
}

.block__title {
  font-size: 1rem;
  margin: 0 0 0.55rem;
}

.block--locked .block__title {
  color: var(--ink-soft);
}

.locked-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.locked {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: baseline;
  padding: 0.55rem 0.7rem;
  margin-bottom: 0.4rem;
  border-radius: 10px;
  border: 1px dashed rgba(201, 184, 168, 0.75);
  background: rgba(255, 255, 255, 0.28);
  opacity: 0.72;
}

.locked__title {
  font-weight: 600;
  font-size: 0.9rem;
}

.locked__meta {
  font-size: 0.75rem;
  color: var(--ink-soft);
  white-space: nowrap;
}
</style>
