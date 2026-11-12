<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Exercise } from '@/types'
import { matchesAccepted, normalizeAnswer, useAnswers } from '@/composables/useAnswers'
import { useSpeech } from '@/composables/useSpeech'

const props = defineProps<{
  exercise: Exercise
  lessonId: string
}>()

const { get, setValue, setResult, setNote, toggleReveal } = useAnswers(props.lessonId)
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
const matchRights = ref<string[]>([])
const speakText = ref('')
const noteText = ref('')
const teacherReply = ref('')

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function rightOwner(right: string): string | null {
  const hit = Object.entries(matchPairs.value).find(([, r]) => r === right)
  return hit?.[0] ?? null
}

function expectedRight(left: string): string | undefined {
  return props.exercise.payload?.pairs?.find((p) => p.left === left)?.right
}

function matchSideClass(side: 'left' | 'right', text: string) {
  const paired =
    side === 'left' ? !!matchPairs.value[text] : !!rightOwner(text)
  const selected = side === 'left' && matchLeft.value === text
  const classes: string[] = []
  if (selected) classes.push('is-picked')
  else if (paired) classes.push('is-linked')

  if (state.value.checked && paired) {
    const left = side === 'left' ? text : rightOwner(text)
    if (!left) return classes.join(' ')
    const ok = matchPairs.value[left] === expectedRight(left)
    classes.push(ok ? 'is-ok' : 'is-bad')
  }
  return classes.join(' ')
}

async function loadTeacherReply() {
  teacherReply.value = ''
  try {
    const base = import.meta.env.BASE_URL
    const res = await fetch(`${base}data/replies.json`)
    if (!res.ok) return
    const data = (await res.json()) as {
      items?: { lessonId: string; exerciseId: string; answer: string }[]
    }
    const hit = data.items?.find(
      (i) => i.lessonId === props.lessonId && i.exerciseId === props.exercise.id,
    )
    teacherReply.value = hit?.answer ?? ''
  } catch {
    teacherReply.value = ''
  }
}

function initFromState() {
  const v = state.value.value
  const ex = props.exercise
  matchLeft.value = null
  noteText.value = state.value.note ?? ''
  void loadTeacherReply()

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
    const pairs = ex.payload?.pairs ?? []
    matchPairs.value = (v as Record<string, string>) || {}
    matchRights.value = shuffle(pairs.map((p) => p.right))
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

function onToggleSolution() {
  toggleReveal(props.exercise.id)
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
    if (matchPairs.value[text]) {
      const next = { ...matchPairs.value }
      delete next[text]
      matchPairs.value = next
      matchLeft.value = null
      setValue(props.exercise.id, { ...next })
      return
    }
    matchLeft.value = matchLeft.value === text ? null : text
    return
  }

  const owner = rightOwner(text)
  if (owner && !matchLeft.value) {
    const next = { ...matchPairs.value }
    delete next[owner]
    matchPairs.value = next
    setValue(props.exercise.id, { ...next })
    return
  }
  if (!matchLeft.value) return

  const next = { ...matchPairs.value }
  if (owner) delete next[owner]
  next[matchLeft.value] = text
  matchPairs.value = next
  matchLeft.value = null
  setValue(props.exercise.id, { ...next })
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
    return (ex.payload?.pairs ?? []).map((p) => `${p.left} — ${p.right}`).join('\n')
  }
  if (ex.type === 'speak') return ex.payload?.target ?? ex.accepted?.[0] ?? ''
  return ''
})

const fieldTone = computed(() => {
  if (!state.value.checked) return ''
  return state.value.correct ? 'is-ok' : 'is-bad'
})
</script>

<template>
  <article
    class="exercise no-swipe"
    :data-type="exercise.type"
    :class="{
      'is-ok': state.checked && state.correct,
      'is-bad': state.checked && !state.correct,
    }"
  >
    <header class="exercise__head">
      <div class="exercise__title-row">
        <p class="exercise__prompt">{{ exercise.prompt }}</p>
        <span
          v-if="state.checked"
          class="verdict"
          :class="state.correct ? 'is-ok' : 'is-bad'"
          :title="state.correct ? 'Верно' : 'Пока неверно'"
        >
          <span class="verdict__icon" aria-hidden="true">{{ state.correct ? '✓' : '–' }}</span>
        </span>
      </div>
      <p v-if="exercise.hint" class="hint">{{ exercise.hint }}</p>
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
          {{ opt === '—' ? '∅' : opt }}
        </button>
      </div>
    </div>

    <!-- translate -->
    <div v-else-if="exercise.type === 'translate'" class="exercise__body">
      <input
        v-model="translateText"
        class="field"
        :class="fieldTone"
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
        :class="fieldTone"
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
      <div class="order-line" :class="fieldTone">
        <button
          v-for="(t, i) in orderSelected"
          :key="'s' + i + t"
          type="button"
          class="chip is-picked"
          @click="pickOrder(t, false)"
        >
          {{ t }}
        </button>
        <span v-if="!orderSelected.length" class="order-line__hint">собери сюда</span>
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
      <p class="match__hint">Сначала слово слева, потом перевод справа. Ещё раз по паре — снять.</p>
      <div class="match__board">
        <div class="match__col">
          <button
            v-for="p in exercise.payload?.pairs ?? []"
            :key="'l' + p.left"
            type="button"
            class="match__item"
            :class="matchSideClass('left', p.left)"
            @click="onMatchClick('left', p.left)"
          >
            {{ p.left }}
          </button>
        </div>
        <div class="match__col">
          <button
            v-for="right in matchRights"
            :key="'r' + right"
            type="button"
            class="match__item"
            :class="matchSideClass('right', right)"
            @click="onMatchClick('right', right)"
          >
            {{ right }}
          </button>
        </div>
      </div>
    </div>

    <!-- speak: Russian prompt → say/write English (no English shown until solution) -->
    <div v-else-if="exercise.type === 'speak'" class="exercise__body">
      <p class="speak-cue">Скажи по-английски (или напиши):</p>
      <div class="speak-actions">
        <button
          type="button"
          class="btn btn--soft"
          :disabled="speechListening"
          @click="startMic"
        >
          {{ speechListening ? '…' : 'Микрофон' }}
        </button>
      </div>
      <p v-if="speechError" class="hint is-bad-text">Микрофон не сработал — напиши ниже.</p>
      <input
        v-model="speakText"
        class="field"
        :class="fieldTone"
        lang="en"
        autocapitalize="sentences"
        autocomplete="off"
        spellcheck="false"
        placeholder="English…"
        @input="setValue(exercise.id, speakText)"
      />
    </div>

    <footer class="exercise__footer">
      <button type="button" class="btn btn--sm" @click="check">Проверить</button>
      <button
        type="button"
        class="btn btn--ghost btn--sm"
        :disabled="!state.checked && !state.revealed"
        @click="onToggleSolution"
      >
        {{ state.revealed ? 'Скрыть решение' : 'Решение' }}
      </button>
      <span v-if="state.errors?.length" class="error-count" title="Ошибки сохранены">
        ошибок в логе: {{ state.errors.length }}
      </span>
    </footer>

    <div v-if="state.revealed" class="solution">
      <p class="solution__answer">{{ solutionText }}</p>
      <p class="note-pencil">{{ exercise.explain }}</p>
    </div>

    <label class="note-box">
      <span class="note-box__label">Заметка / вопрос учителю</span>
      <textarea
        v-model="noteText"
        class="note-box__field"
        rows="2"
        placeholder="Необязательно — увижу в отчёте после «урок прошли»"
        @input="setNote(exercise.id, noteText)"
      />
    </label>

    <aside v-if="teacherReply" class="teacher-reply">
      <p class="teacher-reply__label">Ответ учителя</p>
      <p class="teacher-reply__text">{{ teacherReply }}</p>
    </aside>
  </article>
</template>

<style scoped lang="scss">
.exercise {
  position: relative;
  padding: 0.95rem 0 1.05rem 0.85rem;
  border-bottom: 1px dashed rgba(201, 184, 168, 0.55);

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.95rem;
    bottom: 1.05rem;
    width: 2px;
    border-radius: 2px;
    background: transparent;
    transition: background 0.15s ease;
  }

  &:last-child {
    border-bottom: none;
  }

  &.is-ok::before {
    background: color-mix(in srgb, var(--ok) 55%, transparent);
  }

  &.is-bad::before {
    background: color-mix(in srgb, var(--bad) 45%, transparent);
  }
}

.exercise__title-row {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
}

.exercise__prompt {
  flex: 1;
  font-weight: 600;
  margin: 0 0 0.2rem;
  text-align: left;
  line-height: 1.35;
}

.verdict {
  flex: 0 0 auto;
  width: 1.55rem;
  height: 1.55rem;
  margin-top: 0.05rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  line-height: 1;
  border: 1px solid transparent;

  &.is-ok {
    color: var(--ok);
    background: color-mix(in srgb, var(--ok) 14%, white);
    border-color: color-mix(in srgb, var(--ok) 28%, transparent);
  }

  &.is-bad {
    color: var(--bad);
    background: color-mix(in srgb, var(--bad) 10%, white);
    border-color: color-mix(in srgb, var(--bad) 22%, transparent);
  }
}

.verdict__icon {
  font-weight: 700;
}

.verdict.is-bad .verdict__icon {
  font-size: 1.1rem;
  transform: translateY(-1px);
}

.hint {
  margin: 0 0 0.45rem;
  text-align: left;
}

.exercise__body {
  margin-top: 0.55rem;
}

.exercise__sentence,
.exercise__broken {
  font-family: var(--font-display);
  margin: 0 0 0.65rem;
  text-align: left;
  line-height: 1.4;
}

.exercise__broken {
  text-decoration: underline wavy rgba(138, 79, 69, 0.45);
  text-underline-offset: 0.2em;
}

.options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.order-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  min-height: 48px;
  margin-bottom: 0.55rem;
  padding: 0.4rem 0.55rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.28);
  border: 1px dashed var(--stitch);

  &.is-ok {
    border-color: color-mix(in srgb, var(--ok) 55%, var(--stitch));
    background: var(--ok-bg);
  }

  &.is-bad {
    border-color: color-mix(in srgb, var(--bad) 45%, var(--stitch));
    background: var(--bad-bg);
  }
}

.order-line__hint {
  color: var(--ink-soft);
  font-size: 0.82rem;
}

.chip {
  min-height: 40px;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  border: 1px solid rgba(201, 184, 168, 0.85);
  background: rgba(255, 255, 255, 0.45);
  cursor: pointer;
  text-align: center;
  line-height: 1.2;

  &.is-picked {
    border-color: var(--accent);
    background: var(--accent-soft);
  }

  &.is-ok {
    border-color: color-mix(in srgb, var(--ok) 40%, rgba(201, 184, 168, 0.85));
    background: color-mix(in srgb, var(--ok) 8%, rgba(255, 255, 255, 0.55));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ok) 18%, transparent);
  }

  &.is-bad {
    border-color: color-mix(in srgb, var(--bad) 35%, rgba(201, 184, 168, 0.85));
    background: color-mix(in srgb, var(--bad) 7%, rgba(255, 255, 255, 0.55));
  }
}

.field.is-ok {
  border-color: color-mix(in srgb, var(--ok) 40%, transparent);
  background: color-mix(in srgb, var(--ok) 7%, rgba(255, 255, 255, 0.5));
  box-shadow: none;
}

.field.is-bad {
  border-color: color-mix(in srgb, var(--bad) 35%, transparent);
  background: color-mix(in srgb, var(--bad) 6%, rgba(255, 255, 255, 0.5));
  box-shadow: none;
}

.match__hint {
  margin: 0 0 0.55rem;
  font-size: 0.8rem;
  color: var(--ink-soft);
  line-height: 1.35;
}

.match__board {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem 0.75rem;
  align-items: start;
}

.match__col {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
}

.match__item {
  width: 100%;
  min-height: 44px;
  padding: 0.55rem 0.7rem;
  border-radius: 12px;
  border: 1px solid rgba(201, 184, 168, 0.8);
  background: rgba(255, 255, 255, 0.42);
  text-align: left;
  line-height: 1.3;
  cursor: pointer;
  transition: border-color 0.12s ease, background 0.12s ease;

  &.is-picked {
    border-color: var(--accent);
    background: var(--accent-soft);
  }

  &.is-linked {
    border-color: color-mix(in srgb, var(--accent) 40%, rgba(201, 184, 168, 0.8));
    background: rgba(255, 255, 255, 0.7);
    box-shadow: inset 3px 0 0 color-mix(in srgb, var(--accent) 55%, transparent);
  }

  &.is-ok {
    border-color: color-mix(in srgb, var(--ok) 50%, transparent);
    background: var(--ok-bg);
    box-shadow: inset 3px 0 0 color-mix(in srgb, var(--ok) 65%, transparent);
  }

  &.is-bad {
    border-color: color-mix(in srgb, var(--bad) 45%, transparent);
    background: var(--bad-bg);
    box-shadow: inset 3px 0 0 color-mix(in srgb, var(--bad) 60%, transparent);
  }
}

.exercise__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.7rem;
}

.btn--sm {
  min-height: 38px;
  padding: 0.45rem 0.9rem;
  font-size: 0.9rem;
}

.solution {
  margin-top: 0.7rem;
  padding: 0.55rem 0 0;
  border-top: 1px dashed rgba(201, 184, 168, 0.55);
}

.solution__answer {
  margin: 0 0 0.25rem;
  font-family: var(--font-display);
  font-size: 0.98rem;
  white-space: pre-line;
  text-align: left;
}

.speak-cue {
  margin: 0 0 0.45rem;
  font-size: 0.85rem;
  color: var(--ink-soft);
}

.speak-actions {
  margin-bottom: 0.55rem;
}

.error-count {
  align-self: center;
  font-size: 0.75rem;
  color: var(--ink-soft);
}

.note-box {
  display: block;
  margin-top: 0.75rem;
}

.note-box__label {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.78rem;
  color: var(--ink-soft);
}

.note-box__field {
  width: 100%;
  resize: vertical;
  min-height: 56px;
  border-radius: 10px;
  border: 1px dashed rgba(201, 184, 168, 0.9);
  background: rgba(255, 252, 245, 0.55);
  padding: 0.55rem 0.7rem;
  font: inherit;
  line-height: 1.4;
  outline: none;
}

.note-box__field:focus {
  border-style: solid;
  border-color: var(--accent);
}

.teacher-reply {
  margin-top: 0.55rem;
  padding: 0.55rem 0.7rem;
  border-radius: 10px;
  background: rgba(95, 111, 94, 0.08);
  border: 1px solid rgba(95, 111, 94, 0.18);
}

.teacher-reply__label {
  margin: 0 0 0.2rem;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
}

.teacher-reply__text {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.45;
}

.is-bad-text {
  color: var(--bad);
}
</style>
