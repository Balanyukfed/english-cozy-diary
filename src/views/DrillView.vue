<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useData } from '@/composables/useData'
import type { VocabCard } from '@/types'

const route = useRoute()
const router = useRouter()
const { vocab, loadCore } = useData()

const deckId = computed(() => String(route.query.deck ?? 'all'))

type DeckCard = VocabCard & { group: string }

const allCards = computed((): DeckCard[] => {
  const decks = vocab.value ?? []
  return decks.flatMap((d) =>
    d.cards.map((c) => ({
      ...c,
      group: c.group ?? d.title,
    })),
  )
})

const deckTitle = computed(() => {
  if (deckId.value === 'all') return 'Все слова'
  if (deckId.value === 'warn') return 'Повтор'
  return deckId.value
})

const deckCards = computed(() => {
  if (deckId.value === 'all') return allCards.value
  if (deckId.value === 'warn') return allCards.value.filter((c) => c.warn)
  return allCards.value.filter((c) => c.group === deckId.value)
})

const queue = ref<DeckCard[]>([])
const index = ref(0)
const flipped = ref(false)
const flying = ref(false)
const done = ref(false)

function shuffle<T>(list: T[]): T[] {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function start() {
  queue.value = shuffle(deckCards.value)
  index.value = 0
  flipped.value = false
  flying.value = false
  done.value = queue.value.length === 0
}

onMounted(async () => {
  await loadCore()
  start()
})

watch(deckCards, () => {
  if (vocab.value) start()
})

const remaining = computed(() => Math.max(0, queue.value.length - index.value))
const current = computed(() => queue.value[index.value] ?? null)
const stackPeek = computed(() => queue.value.slice(index.value + 1, index.value + 4))

const progressLabel = computed(() => {
  if (!queue.value.length) return '0 / 0'
  const n = Math.min(index.value + (done.value ? 0 : 1), queue.value.length)
  return `${n} / ${queue.value.length}`
})

function onCardTap() {
  if (!current.value || flying.value || done.value) return
  if (!flipped.value) {
    flipped.value = true
    return
  }
  advance()
}

function advance() {
  if (flying.value || !current.value) return
  flying.value = true
  window.setTimeout(() => {
    flying.value = false
    flipped.value = false
    if (index.value >= queue.value.length - 1) {
      done.value = true
      index.value = queue.value.length
      return
    }
    index.value += 1
  }, 320)
}

function exit() {
  void router.push('/words')
}
</script>

<template>
  <section class="drill">
    <header class="drill__top">
      <button type="button" class="drill__back" @click="exit">‹ Слова</button>
      <div class="drill__meta">
        <p class="drill__deck">{{ deckTitle }}</p>
        <p class="drill__count">{{ progressLabel }}</p>
      </div>
      <button type="button" class="drill__again" :disabled="!queue.length" @click="start">
        Заново
      </button>
    </header>

    <p class="drill__hint">
      Сначала по-русски — скажи/подумай по-английски. Тап: ответ → ещё тап: дальше.
    </p>

    <div v-if="done" class="drill__done">
      <h2>Готово</h2>
      <p>{{ queue.length }} карточек. Без оценки — просто повтор.</p>
      <div class="drill__done-actions">
        <button type="button" class="btn" @click="start">Ещё раз</button>
        <button type="button" class="btn btn--ghost" @click="exit">К словам</button>
      </div>
    </div>

    <div v-else-if="!current" class="drill__empty">
      <p>В этой колоде пока пусто.</p>
      <button type="button" class="btn btn--ghost" @click="exit">Назад</button>
    </div>

    <div v-else class="drill__stage">
      <div class="stack" aria-live="polite">
        <div
          v-for="(peek, i) in [...stackPeek].reverse()"
          :key="`peek-${peek.id}-${index}-${i}`"
          class="stack__ghost"
          :style="{
            '--i': stackPeek.length - 1 - i,
          }"
          aria-hidden="true"
        />

        <button
          type="button"
          class="stack__card"
          :class="{ 'is-flipped': flipped, 'is-flying': flying }"
          @click="onCardTap"
        >
          <div class="stack__face stack__face--front">
            <span class="stack__lang">RU</span>
            <p class="stack__text">{{ current.ru }}</p>
            <span class="stack__cue">тап — ответ</span>
          </div>
          <div class="stack__face stack__face--back">
            <span class="stack__lang">EN</span>
            <p class="stack__text">{{ current.en }}</p>
            <p v-if="current.example" class="stack__example">{{ current.example }}</p>
            <span class="stack__cue">тап — следующая</span>
          </div>
        </button>
      </div>

      <p class="drill__left">ещё {{ Math.max(0, remaining - 1) }}</p>
    </div>
  </section>
</template>

<style scoped lang="scss">
.drill {
  min-height: calc(100dvh - 0.5rem);
  display: flex;
  flex-direction: column;
  padding: 0.35rem 0.15rem 1rem;
}

.drill__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.drill__back,
.drill__again {
  border: none;
  background: transparent;
  color: var(--accent);
  font: inherit;
  font-weight: 650;
  font-size: 0.9rem;
  min-height: 40px;
  padding: 0.25rem 0.35rem;
  cursor: pointer;
}

.drill__again:disabled {
  opacity: 0.35;
}

.drill__meta {
  text-align: center;
  min-width: 0;
}

.drill__deck {
  margin: 0;
  font-weight: 700;
  font-size: 0.95rem;
}

.drill__count {
  margin: 0.1rem 0 0;
  font-size: 0.78rem;
  color: var(--ink-soft);
}

.drill__hint {
  margin: 0 0 1rem;
  font-size: 0.78rem;
  color: var(--ink-soft);
  text-align: center;
  line-height: 1.4;
}

.drill__stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 0;
}

.stack {
  position: relative;
  width: min(100%, 22rem);
  height: min(58dvh, 26rem);
}

.stack__ghost {
  position: absolute;
  inset: 0;
  border-radius: 22px;
  background: #fffcf7;
  border: 1px solid rgba(210, 194, 175, 0.65);
  box-shadow: var(--shadow-warm);
  transform: translateY(calc(var(--i) * 10px)) scale(calc(1 - var(--i) * 0.035))
    rotate(calc(var(--i) * -1.6deg));
  transform-origin: 50% 100%;
  opacity: calc(1 - var(--i) * 0.18);
}

.stack__card {
  position: absolute;
  inset: 0;
  z-index: 5;
  border: none;
  padding: 0;
  background: transparent;
  cursor: pointer;
  perspective: 1200px;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 0.32s ease,
    opacity 0.32s ease;
}

.stack__card.is-flying {
  transform: translateX(120%) rotate(12deg);
  opacity: 0;
}

.stack__face {
  position: absolute;
  inset: 0;
  border-radius: 22px;
  background: #fffcf7;
  border: 1px solid rgba(210, 194, 175, 0.7);
  box-shadow: var(--shadow-page);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 1.4rem 1.2rem;
  box-sizing: border-box;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.stack__face--front {
  background:
    radial-gradient(circle at 18% 12%, rgba(255, 255, 255, 0.7), transparent 45%),
    #fffcf7;
}

.stack__face--back {
  display: none;
  background:
    radial-gradient(circle at 82% 18%, rgba(183, 196, 163, 0.25), transparent 40%),
    #f3ebe0;
}

.stack__card.is-flipped .stack__face--front {
  display: none;
}

.stack__card.is-flipped .stack__face--back {
  display: flex;
}

.stack__lang {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--ink-soft);
  text-transform: uppercase;
}

.stack__text {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.45rem, 5.5vw, 1.9rem);
  line-height: 1.25;
  text-align: center;
  overflow-wrap: anywhere;
}

.stack__example {
  margin: 0;
  font-size: 0.92rem;
  color: var(--ink-soft);
  text-align: center;
  line-height: 1.35;
}

.stack__cue {
  position: absolute;
  bottom: 1rem;
  font-size: 0.75rem;
  color: var(--ink-soft);
}

.drill__left {
  margin: 0;
  font-size: 0.85rem;
  color: var(--ink-soft);
}

.drill__done,
.drill__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  text-align: center;
  padding: 2rem 1rem;
}

.drill__done-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  justify-content: center;
  margin-top: 0.5rem;
}

@media (prefers-reduced-motion: reduce) {
  .stack__card {
    transition: none;
  }
}
</style>
