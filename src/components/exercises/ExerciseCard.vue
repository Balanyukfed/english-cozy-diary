<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Exercise } from '@/types'
import { matchesAccepted, normalizeAnswer, useAnswers } from '@/composables/useAnswers'
import { useSpeech } from '@/composables/useSpeech'

const props = defineProps<{
  exercise: Exercise
  lessonId: string
}>()

const { get, setValue, setResult, reveal } = useAnswers(props.lessonId)
const state = computed(() => get(props.exercise.id))
const {
  listening: speechListening,
  error: speechError,
  start: startSpeech,
} = useSpeech()

const gapChoice = ref('')
const translateText = ref('')
const fixText = ref('')
const orderSelected = ref<string[]>([])
const orderPool = ref<string[]>([])
const matchLeft = ref<string | null>(null)
const matchPairs = ref<Record<string, string>>({})
const speakText = ref('')

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function initFromState() {
  const v = state.value.value
  const ex = props.exercise
  if (ex.type === 'gap' || ex.type === 'choice') {
    gapChoice.value = typeof v === 'string' ? v : ''
  } else if (ex.type === 'translate') {
    translateText.value = typeof v === 'string' ? v : ''
  } else if (ex.type === 'fix') {
    fixText.value = typeof v === 'string' ? v : ''
  } else if (ex.type === 'order') {
    const tokens = ex.payload?.tokens ?? []
    if (Array.isArray(v) && v.length) {
      orderSelected.value = v as string[]
      orderPool.value = tokens.filter((t) => !(v as string[]).includes(t))
      // handle duplicates carefully
      const used = [...(v as string[])]
      orderPool.value = []
      for (const t of shuffle(tokens)) {
        const idx = used.indexOf(t)
        if (idx === -1) orderPool.value.push(t)
        else used.splice(idx, 1)
      }
    } else {
      orderSelected.value = []
      orderPool.value = shuffle(tokens)
    }
  } else if (ex.type === 'match') {
    matchPairs.value = (v as Record<string, string>) || {}
  } else if (ex.type === 'speak') {
    speakText.value = typeof v === 'string' ? v : ''
  }
}

watch(
  () => props.exercise.id,
  () => initFromState(),
  { immediate: true },
)

function check() {
  const ex = props.exercise
  let ok = false
  let value: unknown = null

  if (ex.type === 'gap' || ex.type === 'choice') {
    value = gapChoice.value
    ok = normalizeAnswer(gapChoice.value) === normalizeAnswer(ex.answer ?? '')
  } else if (ex.type === 'translate' || ex.type === 'fix') {
    value = ex.type === 'translate' ? translateText.value : fixText.value
    ok = matchesAccepted(String(value), ex.accepted)
  } else if (ex.type === 'order') {
    value = orderSelected.value
    const joined = orderSelected.value.join(' ')
    ok = matchesAccepted(joined, ex.accepted)
  } else if (ex.type === 'match') {
    value = { ...matchPairs.value }
    const pairs = ex.payload?.pairs ?? []
    ok =
      pairs.length > 0 &&
      pairs.every((p) => matchPairs.value[p.left] === p.right) &&
      Object.keys(matchPairs.value).length === pairs.length
  } else if (ex.type === 'speak') {
    value = speakText.value
    ok = matchesAccepted(speakText.value, ex.accepted)
  }

  setValue(ex.id, value)
  setResult(ex.id, ok)
}

function onReveal() {
  reveal(props.exercise.id)
}

function pickOrder(token: string, fromPool: boolean) {
  if (fromPool) {
    const idx = orderPool.value.indexOf(token)
    if (idx === -1) return
    orderPool.value = [...orderPool.value.slice(0, idx), ...orderPool.value.slice(idx + 1)]
    orderSelected.value = [...orderSelected.value, token]
  } else {
    const idx = orderSelected.value.lastIndexOf(token)
    if (idx === -1) return
    orderSelected.value = [
      ...orderSelected.value.slice(0, idx),
      ...orderSelected.value.slice(idx + 1),
    ]
    orderPool.value = [...orderPool.value, token]
  }
  setValue(props.exercise.id, orderSelected.value)
}

function onMatchClick(side: 'left' | 'right', text: string) {
  if (side === 'left') {
    matchLeft.value = text
    return
  }
  if (!matchLeft.value) return
  matchPairs.value = { ...matchPairs.value, [matchLeft.value]: text }
  matchLeft.value = null
  setValue(props.exercise.id, { ...matchPairs.value })
}

async function startMic() {
  try {
    const text = await startSpeech('en-US')
    speakText.value = text
    setValue(props.exercise.id, text)
  } catch {
    /* error shown via speechError */
  }
}

const solutionText = computed(() => {
  const ex = props.exercise
  if (ex.answer) return ex.answer
  if (ex.accepted?.length) return ex.accepted[0]
  if (ex.type === 'order') return (ex.accepted?.[0] ?? '').toString()
  if (ex.type === 'match') {
    return (ex.payload?.pairs ?? []).map((p) => `${p.left} → ${p.right}`).join(' · ')
  }
  if (ex.type === 'speak') return ex.payload?.target ?? ex.accepted?.[0] ?? ''
  return ''
})

const statusLabel = computed(() => {
  if (!state.value.checked) return ''
  return state.value.correct ? 'Верно' : 'Пока неверно'
})
</script>

<template>
  <article class="exercise no-swipe" :data-type="exercise.type">
    <header class="exercise__head">
      <p class="exercise__prompt">{{ exercise.prompt }}</p>
      <p v-if="exercise.hint" class="hint">{{ exercise.hint }}</p>
      <p
        v-if="state.checked"
        class="exercise__status"
        :class="state.correct ? 'is-ok' : 'is-bad'"
      >
        {{ statusLabel }}
      </p>
    </header>

    <!-- gap / choice -->
    <div v-if="exercise.type === 'gap' || exercise.type === 'choice'" class="exercise__body">
      <p v-if="exercise.payload?.sentence" class="exercise__sentence">
        {{ exercise.payload.sentence }}
      </p>
      <div class="options">
        <button
          v-for="opt in exercise.payload?.options ?? []"
          :key="opt"
          type="button"
          class="chip"
          :class="{
            'is-picked': gapChoice === opt,
            'is-ok': state.checked && gapChoice === opt && state.correct,
            'is-bad': state.checked && gapChoice === opt && !state.correct,
          }"
          @click="
            gapChoice = opt;
            setValue(exercise.id, opt);
          "
        >
          {{ opt === '—' ? '∅ (ничего)' : opt }}
        </button>
      </div>
    </div>

    <!-- translate -->
    <div v-else-if="exercise.type === 'translate'" class="exercise__body">
      <input
        v-model="translateText"
        class="field"
        lang="en"
        autocapitalize="sentences"
        autocomplete="off"
        spellcheck="false"
        placeholder="English…"
        @input="setValue(exercise.id, translateText)"
      />
    </div>

    <!-- fix -->
    <div v-else-if="exercise.type === 'fix'" class="exercise__body">
      <p class="exercise__broken">{{ exercise.payload?.broken }}</p>
      <input
        v-model="fixText"
        class="field"
        lang="en"
        autocapitalize="sentences"
        autocomplete="off"
        spellcheck="false"
        placeholder="Correct sentence…"
        @input="setValue(exercise.id, fixText)"
      />
    </div>

    <!-- order -->
    <div v-else-if="exercise.type === 'order'" class="exercise__body">
      <div class="order-line">
        <button
          v-for="(t, i) in orderSelected"
          :key="'s' + i + t"
          type="button"
          class="chip is-picked"
          @click="pickOrder(t, false)"
        >
          {{ t }}
        </button>
      </div>
      <div class="options">
        <button
          v-for="(t, i) in orderPool"
          :key="'p' + i + t"
          type="button"
          class="chip"
          @click="pickOrder(t, true)"
        >
          {{ t }}
        </button>
      </div>
    </div>

    <!-- match -->
    <div v-else-if="exercise.type === 'match'" class="exercise__body match">
      <div class="match__col">
        <button
          v-for="p in exercise.payload?.pairs ?? []"
          :key="'l' + p.left"
          type="button"
          class="chip"
          :class="{ 'is-picked': matchLeft === p.left, 'is-ok': !!matchPairs[p.left] }"
          @click="onMatchClick('left', p.left)"
        >
          {{ p.left }}
          <small v-if="matchPairs[p.left]">→ {{ matchPairs[p.left] }}</small>
        </button>
      </div>
      <div class="match__col">
        <button
          v-for="p in exercise.payload?.pairs ?? []"
          :key="'r' + p.right"
          type="button"
          class="chip"
          @click="onMatchClick('right', p.right)"
        >
          {{ p.right }}
        </button>
      </div>
    </div>

    <!-- speak -->
    <div v-else-if="exercise.type === 'speak'" class="exercise__body">
      <p class="speak-target">{{ exercise.payload?.target }}</p>
      <div class="speak-actions">
        <button
          type="button"
          class="btn"
          :disabled="speechListening"
          @click="startMic"
        >
          {{ speechListening ? '…' : '🎤' }}
        </button>
      </div>
      <p v-if="speechError" class="hint is-bad-text">Микрофон не сработал — напиши или надиктуй в поле.</p>
      <input
        v-model="speakText"
        class="field"
        lang="en"
        autocapitalize="sentences"
        autocomplete="off"
        spellcheck="false"
        placeholder="What you said…"
        @input="setValue(exercise.id, speakText)"
      />
    </div>

    <footer class="exercise__footer">
      <button type="button" class="btn" @click="check">Проверить</button>
      <button
        type="button"
        class="btn btn--ghost"
        :disabled="!state.checked && !state.revealed"
        @click="onReveal"
      >
        Показать решение
      </button>
    </footer>

    <div v-if="state.revealed" class="solution">
      <p><strong>Решение:</strong> {{ solutionText }}</p>
      <p class="note-pencil">{{ exercise.explain }}</p>
    </div>
  </article>
</template>

<style scoped lang="scss">
.exercise {
  padding: 1rem 0 1.25rem;
  border-bottom: 1px dashed rgba(201, 184, 168, 0.7);

  &:last-child {
    border-bottom: none;
  }
}

.exercise__prompt {
  font-weight: 600;
  margin-bottom: 0.35rem;
}

.exercise__status {
  display: inline-block;
  margin: 0.35rem 0 0;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;

  &.is-ok {
    background: var(--ok-bg);
    color: var(--ok);
  }

  &.is-bad {
    background: var(--bad-bg);
    color: var(--bad);
  }
}

.exercise__sentence,
.exercise__broken {
  font-family: var(--font-display);
  margin-bottom: 0.75rem;
}

.exercise__broken {
  text-decoration: underline wavy rgba(138, 79, 69, 0.5);
}

.options,
.order-line,
.match__col {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.order-line {
  min-height: 52px;
  padding: 0.5rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.35);
  border: 1px dashed var(--stitch);
}

.chip {
  min-height: 44px;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(201, 184, 168, 0.85);
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;

  small {
    display: block;
    color: var(--ink-soft);
  }

  &.is-picked {
    border-color: var(--accent);
    background: var(--accent-soft);
  }

  &.is-ok {
    border-color: var(--ok);
    background: var(--ok-bg);
  }

  &.is-bad {
    border-color: var(--bad);
    background: var(--bad-bg);
  }
}

.match {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.exercise__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.solution {
  margin-top: 0.85rem;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  background: rgba(95, 111, 94, 0.08);
}

.speak-target {
  font-family: var(--font-display);
  font-weight: 600;
  margin-bottom: 0.65rem;
}

.speak-actions {
  margin-bottom: 0.65rem;
}

.is-bad-text {
  color: var(--bad);
}
</style>
