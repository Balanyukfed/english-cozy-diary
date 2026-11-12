import { ref } from 'vue'
import type {
  JournalData,
  Lesson,
  Meta,
  SprintBlock,
  TenseCard,
  VocabCard,
  WeakSpot,
} from '@/types'

const base = import.meta.env.BASE_URL

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${base}data/${path}`)
  if (!res.ok) throw new Error(`Failed to load ${path}`)
  return res.json() as Promise<T>
}

const meta = ref<Meta | null>(null)
const journal = ref<JournalData | null>(null)
const sprint = ref<SprintBlock[] | null>(null)
const weakSpots = ref<WeakSpot[] | null>(null)
const vocab = ref<{ id: string; title: string; cards: VocabCard[] }[] | null>(null)
const tenses = ref<TenseCard[] | null>(null)
const lessonsCache = ref<Record<string, Lesson>>({})

export function useData() {
  async function loadCore() {
    const [m, j, s, w, v, t] = await Promise.all([
      fetchJson<Meta>('meta.json'),
      fetchJson<JournalData>('journal.json'),
      fetchJson<{ blocks: SprintBlock[] }>('sprint.json'),
      fetchJson<{ items: WeakSpot[] }>('weak-spots.json'),
      fetchJson<{ decks: { id: string; title: string; cards: VocabCard[] }[] }>('vocab.json'),
      fetchJson<{ cards: TenseCard[] }>('tenses.json'),
    ])
    meta.value = m
    journal.value = j
    sprint.value = s.blocks
    weakSpots.value = w.items
    vocab.value = v.decks
    tenses.value = t.cards
  }

  async function loadLesson(id: string): Promise<Lesson | null> {
    if (lessonsCache.value[id]) return lessonsCache.value[id]
    try {
      const lesson = await fetchJson<Lesson>(`lessons/${id}.json`)
      lessonsCache.value[id] = lesson
      return lesson
    } catch {
      return null
    }
  }

  function availableLessonIds(): string[] {
    if (!sprint.value) return []
    return sprint.value.flatMap((b) =>
      b.lessons.filter((l) => l.status !== 'todo').map((l) => l.id),
    )
  }

  async function listOpenLessons(): Promise<Lesson[]> {
    const ids = availableLessonIds()
    const result: Lesson[] = []
    for (const id of ids) {
      const l = await loadLesson(id)
      if (l) result.push(l)
    }
    return result
  }

  return {
    meta,
    journal,
    sprint,
    weakSpots,
    vocab,
    tenses,
    loadCore,
    loadLesson,
    listOpenLessons,
    availableLessonIds,
  }
}
