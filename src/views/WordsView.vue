<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useData } from '@/composables/useData'
import FlashCard from '@/components/cards/FlashCard.vue'
import MasonryGrid from '@/components/cards/MasonryGrid.vue'
import type { VocabCard } from '@/types'

const { vocab, loadCore } = useData()
const onlyWarn = ref(false)
const grouped = ref(false)

onMounted(() => {
  void loadCore()
})

const allCards = computed(() => {
  const decks = vocab.value ?? []
  return decks.flatMap((d) =>
    d.cards.map((c) => ({
      ...c,
      group: c.group ?? d.title,
    })),
  )
})

const cards = computed(() => {
  const list = onlyWarn.value ? allCards.value.filter((c) => c.warn) : allCards.value
  return [...list].sort((a, b) => a.en.localeCompare(b.en, 'en'))
})

type CardGroup = { title: string; cards: VocabCard[] }

const groups = computed((): CardGroup[] => {
  const list = onlyWarn.value ? allCards.value.filter((c) => c.warn) : allCards.value
  const warn = list.filter((c) => c.warn)
  const rest = list.filter((c) => !c.warn)

  const byTheme = new Map<string, VocabCard[]>()
  for (const c of rest) {
    const key = c.group ?? 'Разное'
    if (!byTheme.has(key)) byTheme.set(key, [])
    byTheme.get(key)!.push(c)
  }

  const out: CardGroup[] = []
  if (warn.length) {
    out.push({
      title: 'Повтор',
      cards: [...warn].sort((a, b) => a.en.localeCompare(b.en, 'en')),
    })
  }
  for (const title of [...byTheme.keys()].sort((a, b) => a.localeCompare(b, 'ru'))) {
    out.push({
      title,
      cards: [...byTheme.get(title)!].sort((a, b) => a.en.localeCompare(b.en, 'en')),
    })
  }
  return out
})

type TrainDeck = { id: string; title: string; count: number }

const trainDecks = computed((): TrainDeck[] => {
  const warnCount = allCards.value.filter((c) => c.warn).length
  const byTheme = new Map<string, number>()
  for (const c of allCards.value) {
    const key = c.group ?? 'Разное'
    byTheme.set(key, (byTheme.get(key) ?? 0) + 1)
  }

  const decks: TrainDeck[] = [
    { id: 'all', title: 'Все подряд', count: allCards.value.length },
  ]
  if (warnCount) {
    decks.push({ id: 'warn', title: 'Повтор', count: warnCount })
  }
  for (const title of [...byTheme.keys()].sort((a, b) => a.localeCompare(b, 'ru'))) {
    decks.push({ id: title, title, count: byTheme.get(title)! })
  }
  return decks.filter((d) => d.count > 0)
})

function cardKey(c: VocabCard) {
  return c.id
}
</script>

<template>
  <section>
    <header class="head">
      <h1>Слова</h1>
      <div class="toggles">
        <label class="toggle">
          <input v-model="onlyWarn" type="checkbox" />
          Только повтор
        </label>
        <label class="toggle">
          <input v-model="grouped" type="checkbox" />
          По группам
        </label>
      </div>
    </header>

    <section class="train">
      <div class="train__head">
        <h2>Тренировка</h2>
        <p class="hint">
          Как колода: русский → сам переводишь → тап — английский → тап — следующая. Без оценки.
        </p>
      </div>
      <div class="train__decks">
        <RouterLink
          v-for="d in trainDecks"
          :key="d.id"
          class="train__chip"
          :to="{ name: 'words-drill', query: { deck: d.id } }"
        >
          <span class="train__chip-title">{{ d.title }}</span>
          <span class="train__chip-count">{{ d.count }}</span>
        </RouterLink>
      </div>
    </section>

    <p class="hint">
      Сетка ниже — шпаргалка. «Повтор» — не отдельная тема, а слова, которые сейчас нужно чаще
      крутить; когда стабильно ок — метку снимаю, слово остаётся только в своей теме (Аэропорт,
      Фразы…).
    </p>

    <template v-if="!grouped">
      <MasonryGrid :items="cards" :get-key="cardKey">
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
    </template>

    <template v-else>
      <section v-for="g in groups" :key="g.title" class="group">
        <div class="group__row">
          <h2 class="group__title">{{ g.title }}</h2>
          <RouterLink
            class="group__drill"
            :to="{
              name: 'words-drill',
              query: { deck: g.title === 'Повтор' ? 'warn' : g.title },
            }"
          >
            Тренировать
          </RouterLink>
        </div>
        <MasonryGrid :items="g.cards" :get-key="cardKey">
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
    </template>
  </section>
</template>

<style scoped lang="scss">
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.35rem;
  flex-wrap: wrap;
}

.toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem 1rem;
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 40px;
  color: var(--ink-soft);
  font-size: 0.88rem;
}

.hint {
  margin: 0 0 0.85rem;
  font-size: 0.8rem;
  color: var(--ink-soft);
  line-height: 1.4;
}

.train {
  margin: 0.35rem 0 1rem;
  padding: 0.85rem 0.9rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.42);
  border: 1px solid rgba(210, 194, 175, 0.55);
}

.train__head h2 {
  font-size: 1.05rem;
  margin: 0 0 0.25rem;
}

.train__head .hint {
  margin-bottom: 0.65rem;
}

.train__decks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.train__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 40px;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  text-decoration: none;
  color: var(--ink);
  background: rgba(255, 252, 247, 0.95);
  border: 1px solid rgba(201, 184, 168, 0.75);
  font-size: 0.86rem;
  font-weight: 650;
}

.train__chip-count {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--ink-soft);
  background: rgba(106, 101, 88, 0.1);
  border-radius: 999px;
  padding: 0.12rem 0.4rem;
}

.group {
  margin-bottom: 1.15rem;
}

.group__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.55rem;
}

.group__title {
  font-size: 1rem;
  margin: 0;
}

.group__drill {
  font-size: 0.82rem;
  font-weight: 650;
  text-decoration: none;
  white-space: nowrap;
}
</style>
