<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useData } from '@/composables/useData'
import FlashCard from '@/components/cards/FlashCard.vue'
import MasonryGrid from '@/components/cards/MasonryGrid.vue'
import type { VocabCard } from '@/types'

const { meta, journal, weakSpots, vocab, loadCore } = useData()

onMounted(() => {
  void loadCore()
})

const topWeak = computed(() => weakSpots.value?.find((w) => w.priority === 'high'))
const todayCards = computed(() => {
  const all = vocab.value?.flatMap((d) => d.cards) ?? []
  const warn = all.filter((c) => c.warn)
  const rest = all.filter((c) => !c.warn)
  return [...warn, ...rest].slice(0, 8)
})

function cardKey(c: VocabCard) {
  return c.id
}
</script>

<template>
  <section class="today">
    <header class="today__head">
      <p class="eyebrow">English Diary</p>
      <h1>Сегодня</h1>
      <p v-if="meta" class="hint">До {{ meta.deadline }}</p>
    </header>

    <article class="page-block">
      <h2>План</h2>
      <p v-if="journal" class="today__stage">{{ journal.stage }}</p>
      <RouterLink class="btn" :to="`/diary?lesson=${meta?.nextLessonId ?? 'S1'}`">
        Открыть тетрадь
      </RouterLink>
    </article>

    <article v-if="journal" class="page-block">
      <h2>Домашка</h2>
      <p>{{ journal.homework }}</p>
      <RouterLink class="linkish" to="/stats">Успеваемость</RouterLink>
    </article>

    <article v-if="topWeak" class="page-block page-block--soft">
      <h2>Хромает</h2>
      <p><strong>{{ topWeak.topic }}</strong></p>
      <p class="note-pencil">В чате: Упор: {{ topWeak.topic }}</p>
    </article>

    <section class="today__cards">
      <div class="today__cards-head">
        <h2>Карточки на сейчас</h2>
        <RouterLink class="linkish" to="/words">Все слова</RouterLink>
      </div>
      <MasonryGrid :items="todayCards" :get-key="cardKey">
        <template #default="{ item: c }">
          <FlashCard
            :front="c.en"
            :back-title="c.ru"
            :back-lines="c.example ? [c.example] : []"
            :warn="c.warn"
            :tag="c.warn ? 'повтор' : undefined"
          />
        </template>
      </MasonryGrid>
    </section>
  </section>
</template>

<style scoped lang="scss">
.today__head {
  margin-bottom: 1rem;
  padding-left: 0.35rem;
  border-left: 2px solid color-mix(in srgb, var(--margin-line) 70%, transparent);
}

.eyebrow {
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 0 0 0.25rem;
}

h1 {
  font-size: clamp(1.8rem, 4vw, 2.25rem);
  margin-bottom: 0.2rem;
}

.page-block {
  padding: 1rem 0 1.15rem;
  margin-bottom: 0.25rem;
  border-bottom: 1px dashed rgba(210, 194, 175, 0.75);

  h2 {
    font-size: 1.15rem;
  }
}

.page-block--soft {
  background: rgba(255, 255, 255, 0.35);
  border: 1px solid rgba(210, 194, 175, 0.45);
  border-radius: var(--radius);
  padding: 0.95rem 1rem;
  border-bottom: 1px solid rgba(210, 194, 175, 0.45);
}

.today__stage {
  margin: 0.35rem 0 0.65rem;
}

.btn {
  display: inline-flex;
  margin: 0.35rem 0 0.5rem;
}

.today__cards {
  margin-top: 1.1rem;
  padding-bottom: 0.5rem;
}

.today__cards-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.linkish {
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
}
</style>
