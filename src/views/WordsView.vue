<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useData } from '@/composables/useData'
import FlashCard from '@/components/cards/FlashCard.vue'
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

    <p class="hint">
      По умолчанию — одна сетка. «По группам»: сначала повтор, потом темы (как ведёт учитель).
    </p>

    <template v-if="!grouped">
      <div class="card-masonry">
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
    </template>

    <template v-else>
      <section v-for="g in groups" :key="g.title" class="group">
        <h2 class="group__title">{{ g.title }}</h2>
        <div class="card-masonry">
          <FlashCard
            v-for="c in g.cards"
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
}

.group {
  margin-bottom: 1.15rem;
}

.group__title {
  font-size: 1rem;
  margin: 0 0 0.55rem;
}

</style>
