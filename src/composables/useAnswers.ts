import { ref, watch } from 'vue'
import type { Exercise, Lesson } from '@/types'

export type AnswerError = {
  value: unknown
  at: string
}

export type AnswerState = {
  value: unknown
  checked: boolean
  correct: boolean | null
  revealed: boolean
  note: string
  /** Wrong attempts kept even after a later correct answer */
  errors: AnswerError[]
}

const store = ref<Record<string, Record<string, AnswerState>>>({})

function storageKey(lessonId: string) {
  return `cozy-diary:answers:${lessonId}`
}

function emptyState(): AnswerState {
  return {
    value: null,
    checked: false,
    correct: null,
    revealed: false,
    note: '',
    errors: [],
  }
}

function normalizeLoaded(raw: Partial<AnswerState>): AnswerState {
  return {
    ...emptyState(),
    ...raw,
    note: typeof raw.note === 'string' ? raw.note : '',
    errors: Array.isArray(raw.errors) ? raw.errors : [],
  }
}

function loadLesson(lessonId: string) {
  if (store.value[lessonId]) return
  try {
    const raw = localStorage.getItem(storageKey(lessonId))
    const parsed = raw ? (JSON.parse(raw) as Record<string, Partial<AnswerState>>) : {}
    const next: Record<string, AnswerState> = {}
    for (const [id, state] of Object.entries(parsed)) {
      next[id] = normalizeLoaded(state)
    }
    store.value[lessonId] = next
  } catch {
    store.value[lessonId] = {}
  }
}

function persist(lessonId: string) {
  localStorage.setItem(storageKey(lessonId), JSON.stringify(store.value[lessonId] ?? {}))
}

function formatValue(value: unknown): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.join(' ')
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, string>)
      .map(([k, v]) => `${k}→${v}`)
      .join(', ')
  }
  return String(value)
}

export function buildTeacherReport(lesson: Lesson): string {
  loadLesson(lesson.id)
  const answers = store.value[lesson.id] ?? {}
  const exercises: { sheet: string; ex: Exercise }[] = []
  for (const sheet of lesson.sheets) {
    for (const ex of sheet.exercises ?? []) {
      exercises.push({ sheet: sheet.title, ex })
    }
  }

  const lines: string[] = [
    `Cozy Diary report — ${lesson.id} (${lesson.title})`,
    `date: ${new Date().toISOString()}`,
    '',
  ]

  const withErrors = exercises.filter(({ ex }) => (answers[ex.id]?.errors?.length ?? 0) > 0)
  const withNotes = exercises.filter(({ ex }) => (answers[ex.id]?.note ?? '').trim())
  const checked = exercises.filter(({ ex }) => answers[ex.id]?.checked)
  const wrongNow = checked.filter(({ ex }) => answers[ex.id]?.correct === false)
  const okNow = checked.filter(({ ex }) => answers[ex.id]?.correct === true)

  lines.push(
    `checked: ${checked.length}/${exercises.length} · now ok: ${okNow.length} · now wrong: ${wrongNow.length} · ever wrong: ${withErrors.length} · notes: ${withNotes.length}`,
    '',
  )

  if (withErrors.length) {
    lines.push('## Errors (kept even if later fixed)')
    for (const { sheet, ex } of withErrors) {
      const a = answers[ex.id]
      lines.push(`- [${sheet}] ${ex.id} · ${ex.prompt}`)
      for (const err of a.errors) {
        lines.push(`  × ${formatValue(err.value)}`)
      }
      if (a.correct) lines.push(`  ✓ later: ${formatValue(a.value)}`)
      else if (a.checked) lines.push(`  still wrong: ${formatValue(a.value)}`)
    }
    lines.push('')
  }

  if (withNotes.length) {
    lines.push('## Student notes / questions')
    for (const { sheet, ex } of withNotes) {
      lines.push(`- [${sheet}] ${ex.id} · ${ex.prompt}`)
      lines.push(`  note: ${answers[ex.id].note.trim()}`)
    }
    lines.push('')
  }

  if (!withErrors.length && !withNotes.length) {
    lines.push('(no saved errors or notes for this lesson)')
  }

  lines.push('— paste this in chat after «урок прошли» / «дз сделал» —')
  return lines.join('\n')
}

export function useAnswers(lessonId: string) {
  loadLesson(lessonId)

  function get(exerciseId: string): AnswerState {
    loadLesson(lessonId)
    if (!store.value[lessonId][exerciseId]) {
      store.value[lessonId][exerciseId] = emptyState()
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
    if (!correct) {
      a.errors = [
        ...a.errors,
        {
          value: a.value,
          at: new Date().toISOString(),
        },
      ]
    }
    persist(lessonId)
  }

  function setNote(exerciseId: string, note: string) {
    const a = get(exerciseId)
    a.note = note
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
    const prev = get(exerciseId)
    store.value[lessonId][exerciseId] = {
      ...emptyState(),
      note: prev.note,
      errors: prev.errors,
    }
    persist(lessonId)
  }

  watch(
    () => store.value[lessonId],
    () => persist(lessonId),
    { deep: true },
  )

  return {
    get,
    setValue,
    setResult,
    setNote,
    reveal,
    hideSolution,
    toggleReveal,
    reset,
    store,
  }
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
