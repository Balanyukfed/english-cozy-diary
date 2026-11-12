import { computed, ref } from 'vue'
import type { Lesson, WeakSpot } from '@/types'
import { listStoredLessonIds, peekLessonAnswers, type AnswerState } from '@/composables/useAnswers'
import { useData } from '@/composables/useData'

export type LessonStat = {
  id: string
  title: string
  status: string
  total: number
  checked: number
  correctNow: number
  firstTryOk: number
  everWrong: number
  notes: number
  /** % of checked that are currently correct */
  accuracyPct: number | null
  /** % of checked with no error log */
  firstTryPct: number | null
}

export type DrillIdea = {
  id: string
  topic: string
  reason: string
  priority: WeakSpot['priority']
  chatHint: string
}

function pct(part: number, whole: number): number | null {
  if (whole <= 0) return null
  return Math.round((part / whole) * 100)
}

function summarizeAnswers(
  answers: Record<string, AnswerState>,
  exerciseIds: string[],
): Omit<LessonStat, 'id' | 'title' | 'status'> {
  let checked = 0
  let correctNow = 0
  let firstTryOk = 0
  let everWrong = 0
  let notes = 0

  for (const id of exerciseIds) {
    const a = answers[id]
    if (!a) continue
    if (a.note?.trim()) notes += 1
    if ((a.errors?.length ?? 0) > 0) everWrong += 1
    if (!a.checked) continue
    checked += 1
    if (a.correct) correctNow += 1
    if (a.correct && (a.errors?.length ?? 0) === 0) firstTryOk += 1
  }

  return {
    total: exerciseIds.length,
    checked,
    correctNow,
    firstTryOk,
    everWrong,
    notes,
    accuracyPct: pct(correctNow, checked),
    firstTryPct: pct(firstTryOk, checked),
  }
}

export function useStats() {
  const { loadCore, loadLesson, sprint, weakSpots, meta, vocab } = useData()
  const ready = ref(false)
  const lessonStats = ref<LessonStat[]>([])

  async function refresh() {
    await loadCore()
    const sprintLessons = sprint.value?.flatMap((b) => b.lessons) ?? []
    const stored = new Set(listStoredLessonIds())
    const ids = [
      ...new Set([
        ...sprintLessons.filter((l) => l.status !== 'todo').map((l) => l.id),
        ...stored,
      ]),
    ].sort()

    const rows: LessonStat[] = []
    for (const id of ids) {
      const lesson: Lesson | null = await loadLesson(id)
      const metaRow = sprintLessons.find((l) => l.id === id)
      const answers = peekLessonAnswers(id)
      const exerciseIds =
        lesson?.sheets.flatMap((s) => (s.exercises ?? []).map((e) => e.id)) ??
        Object.keys(answers)
      const summary = summarizeAnswers(answers, exerciseIds)
      rows.push({
        id,
        title: lesson?.title ?? metaRow?.title ?? id,
        status: lesson?.status ?? metaRow?.status ?? '—',
        ...summary,
      })
    }
    lessonStats.value = rows
    ready.value = true
  }

  const totals = computed(() => {
    const rows = lessonStats.value
    const checked = rows.reduce((s, r) => s + r.checked, 0)
    const correctNow = rows.reduce((s, r) => s + r.correctNow, 0)
    const firstTryOk = rows.reduce((s, r) => s + r.firstTryOk, 0)
    const everWrong = rows.reduce((s, r) => s + r.everWrong, 0)
    const notes = rows.reduce((s, r) => s + r.notes, 0)
    return {
      lessonsTouched: rows.filter((r) => r.checked > 0).length,
      checked,
      correctNow,
      firstTryOk,
      everWrong,
      notes,
      accuracyPct: pct(correctNow, checked),
      firstTryPct: pct(firstTryOk, checked),
      progressLessons: meta.value?.progressLessons ?? 0,
      totalLessons: meta.value?.totalLessons ?? 33,
    }
  })

  const focusTopics = computed(() => {
    const items = [...(weakSpots.value ?? [])]
    const order = { high: 0, medium: 1, low: 2, done: 3 }
    return items
      .filter((w) => w.priority !== 'done')
      .sort((a, b) => order[a.priority] - order[b.priority])
  })

  const warnCards = computed(
    () => vocab.value?.flatMap((d) => d.cards).filter((c) => c.warn).length ?? 0,
  )

  /** Ideas for future auto-drills + chat «Упор» */
  const drillIdeas = computed((): DrillIdea[] => {
    const ideas: DrillIdea[] = focusTopics.value.map((w) => ({
      id: w.id,
      topic: w.topic,
      reason: w.why,
      priority: w.priority,
      chatHint: `Упор: ${w.topic}`,
    }))

    for (const row of lessonStats.value) {
      if (row.everWrong >= 3 && row.firstTryPct != null && row.firstTryPct < 70) {
        ideas.push({
          id: `lesson-${row.id}`,
          topic: `Доп. по ${row.id}`,
          reason: `С первого раза ~${row.firstTryPct}%, ошибок в логе: ${row.everWrong}`,
          priority: 'medium',
          chatHint: `Упор: повтор ${row.id}`,
        })
      }
    }
    return ideas
  })

  return {
    ready,
    lessonStats,
    totals,
    focusTopics,
    warnCards,
    drillIdeas,
    refresh,
  }
}
