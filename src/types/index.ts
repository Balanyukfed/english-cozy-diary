export type ExerciseType =
  | 'gap'
  | 'choice'
  | 'order'
  | 'match'
  | 'fix'
  | 'translate'
  | 'speak'

export type SheetType =
  | 'cover'
  | 'review'
  | 'cold'
  | 'explain'
  | 'practice'
  | 'voice'
  | 'test'
  | 'vocab'
  | 'hw'

export interface SchemaTable {
  headers: string[]
  rows: string[][]
  caption?: string
}

export interface Exercise {
  id: string
  type: ExerciseType
  prompt: string
  hint?: string
  explain: string
  /** Correct answer(s) depending on type */
  accepted?: string[]
  answer?: string
  payload?: {
    sentence?: string
    options?: string[]
    tokens?: string[]
    pairs?: { left: string; right: string }[]
    broken?: string
    target?: string
  }
}

export interface LessonSheet {
  id: string
  type: SheetType
  title: string
  body?: string
  schema?: SchemaTable
  pencilNotes?: string[]
  exercises?: Exercise[]
  chips?: string[]
}

export interface Lesson {
  id: string
  title: string
  date?: string
  status: 'todo' | 'current' | 'done'
  sheets: LessonSheet[]
}

export interface SprintLesson {
  id: string
  title: string
  status: 'todo' | 'current' | 'done'
}

export interface SprintBlock {
  id: string
  title: string
  lessons: SprintLesson[]
}

export interface VocabCard {
  id: string
  en: string
  ru: string
  example?: string
  warn?: boolean
  /** Theme bucket for «По группам» on Words screen */
  group?: string
}

export type GrammarSection = 'tenses' | 'structure'

export interface TenseCard {
  id: string
  title: string
  formula: string
  examples: string[]
  mistake: string
  /** tenses = времена; structure = скелет/артикли/предлоги… */
  section: GrammarSection
  /** Appears after this lesson is unlocked (done or current) */
  unlockedBy: string
}

export interface WeakSpot {
  id: string
  priority: 'high' | 'medium' | 'low' | 'done'
  topic: string
  why: string
  plan: string
}

export interface Meta {
  name: string
  deadline: string
  progressLessons: number
  totalLessons: number
  nextLessonId: string
}

export interface JournalData {
  stage: string
  homework: string
  strengths: string[]
  weaknesses: string[]
  mode: string
}
