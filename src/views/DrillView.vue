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

/** Current top + peeks under it (stable keys → peeks slide forward). */
const visibleCards = computed(() => {
  if (done.value) return [] as DeckCard[]
  // Keep the flying card in the list until the animation ends.
  const startAt = index.value
  return queue.value.slice(startAt, startAt + 4)
})

const remaining = computed(() => Math.max(0, queue.value.length - index.value))

const progressLabel = computed(() => {
  if (!queue.value.length) return '0 / 0'
  const n = Math.min(index.value + (done.value ? 0 : 1), queue.value.length)
  return `${n} / ${queue.value.length}`
})

function depthFor(i: number) {
  // While top flies away, everyone under it steps one level forward.
  if (flying.value && i > 0) return i - 1
  return i
}

function onCardTap() {
  if (!visibleCards.value[0] || flying.value || done.value) return
  if (!flipped.value) {
    flipped.value = true
    return
  }
  advance()
}

function advance() {
  if (flying.value || !visibleCards.value[0]) return
  flying.value = true
  window.setTimeout(() => {
    flipped.value = false
    if (index.value >= queue.value.length - 1) {
      done.value = true
      index.value = queue.value.length
      flying.value = false
      return
    }
    index.value += 1
    // next frame: clear flying so the new top stays put (already at depth 0)
    requestAnimationFrame(() => {
      flying.value = false
    })
  }, 380)
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

    <div v-else-if="!visibleCards.length" class="drill__empty">
      <p>В этой колоде пока пусто.</p>
      <button type="button" class="btn btn--ghost" @click="exit">Назад</button>
    </div>

    <div v-else class="drill__stage">
      <div class="stack" aria-live="polite">
        <button
          v-for="(card, i) in visibleCards"
          :key="card.id"
          type="button"
          class="stack__layer"
          :class="{
            'is-exit': flying && i === 0,
            'is-top': depthFor(i) === 0 && !(flying && i === 0),
            'is-flipped': i === 0 && flipped && !flying,
            'is-peek': depthFor(i) > 0,
          }"
          :style="{
            '--depth': depthFor(i),
            zIndex: flying && i === 0 ? 30 : 20 - depthFor(i),
          }"
          :tabindex="i === 0 && !flying ? 0 : -1"
          :aria-hidden="i !== 0"
          @click="i === 0 ? onCardTap() : undefined"
        >
          <div class="stack__face stack__face--front">
            <template v-if="depthFor(i) === 0 && !(flying && i === 0)">
              <span class="stack__lang">RU</span>
              <p class="stack__text">{{ card.ru }}</p>
              <span class="stack__cue">тап — ответ</span>
            </template>
          </div>
          <div class="stack__face stack__face--back">
            <span class="stack__lang">EN</span>
            <p class="stack__text">{{ card.en }}</p>
            <p v-if="card.example" class="stack__example">{{ card.example }}</p>
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

.stack__layer {
  position: absolute;
  inset: 0;
  border: none;
  padding: 0;
  background: transparent;
  cursor: default;
  transform-origin: 50% 100%;
  transform: translateY(calc(var(--depth) * 11px)) scale(calc(1 - var(--depth) * 0.04))
    rotate(calc(var(--depth) * -1.8deg));
  opacity: calc(1 - var(--depth) * 0.16);
  transition:
    transform 0.38s cubic-bezier(0.22, 0.9, 0.28, 1),
    opacity 0.38s ease;
  -webkit-tap-highlight-color: transparent;
}

.stack__layer.is-top {
  cursor: pointer;
}

.stack__layer.is-exit {
  transform: translate(118%, -6%) rotate(16deg) scale(1);
  opacity: 0;
  pointer-events: none;
  transition:
    transform 0.38s cubic-bezier(0.4, 0.05, 0.7, 0.2),
    opacity 0.3s ease;
}

.stack__layer.is-peek {
  pointer-events: none;
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

.stack__layer.is-flipped .stack__face--front {
  display: none;
}

.stack__layer.is-flipped .stack__face--back {
  display: flex;
}

.stack__layer.is-peek .stack__face {
  box-shadow: var(--shadow-warm);
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
  .stack__layer {
    transition: none;
  }
}
</style>
