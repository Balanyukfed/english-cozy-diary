import { ref, watch } from 'vue'

export type AnswerState = {
  value: unknown
  checked: boolean
  correct: boolean | null
  revealed: boolean
}

const store = ref<Record<string, Record<string, AnswerState>>>({})

function storageKey(lessonId: string) {
  return `cozy-diary:answers:${lessonId}`
}

function loadLesson(lessonId: string) {
  if (store.value[lessonId]) return
  try {
    const raw = localStorage.getItem(storageKey(lessonId))
    store.value[lessonId] = raw ? (JSON.parse(raw) as Record<string, AnswerState>) : {}
  } catch {
    store.value[lessonId] = {}
  }
}

function persist(lessonId: string) {
  localStorage.setItem(storageKey(lessonId), JSON.stringify(store.value[lessonId] ?? {}))
}

export function useAnswers(lessonId: string) {
  loadLesson(lessonId)

  function get(exerciseId: string): AnswerState {
    loadLesson(lessonId)
    if (!store.value[lessonId][exerciseId]) {
      store.value[lessonId][exerciseId] = {
        value: null,
        checked: false,
        correct: null,
        revealed: false,
      }
    }
    return store.value[lessonId][exerciseId]
  }

  function setValue(exerciseId: string, value: unknown) {
    const a = get(exerciseId)
    a.value = value
    a.checked = false
    a.correct = null
    persist(lessonId)
  }

  function setResult(exerciseId: string, correct: boolean) {
    const a = get(exerciseId)
    a.checked = true
    a.correct = correct
    persist(lessonId)
  }

  function reveal(exerciseId: string) {
    const a = get(exerciseId)
    a.revealed = true
    persist(lessonId)
  }

  function hideSolution(exerciseId: string) {
    const a = get(exerciseId)
    a.revealed = false
    persist(lessonId)
  }

  function toggleReveal(exerciseId: string) {
    const a = get(exerciseId)
    a.revealed = !a.revealed
    persist(lessonId)
  }

  function reset(exerciseId: string) {
    store.value[lessonId][exerciseId] = {
      value: null,
      checked: false,
      correct: null,
      revealed: false,
    }
    persist(lessonId)
  }

  watch(
    () => store.value[lessonId],
    () => persist(lessonId),
    { deep: true },
  )

  return { get, setValue, setResult, reveal, hideSolution, toggleReveal, reset, store }
}

export function normalizeAnswer(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[!.?]+$/g, '')
    .toLowerCase()
}

export function matchesAccepted(input: string, accepted: string[] = []): boolean {
  const n = normalizeAnswer(input)
  return accepted.some((a) => normalizeAnswer(a) === n)
}
