<script setup lang="ts">
import type { LessonSheet } from '@/types'
import SchemaTable from './SchemaTable.vue'
import ExerciseCard from '@/components/exercises/ExerciseCard.vue'

defineProps<{
  sheet: LessonSheet
  lessonId: string
}>()

const typeLabel: Record<string, string> = {
  cover: 'обложка',
  review: 'повтор',
  cold: 'холодная попытка',
  explain: 'теория',
  practice: 'практика',
  voice: 'голос',
  test: 'мини-тест',
  vocab: 'слова',
  hw: 'домашка',
}
</script>

<template>
  <article class="sheet">
    <div class="sheet__margin" aria-hidden="true" />
    <div class="sheet__content">
      <p class="sheet__type">{{ typeLabel[sheet.type] ?? sheet.type }}</p>
      <h2>{{ sheet.title }}</h2>
      <p v-if="sheet.body" class="sheet__body">{{ sheet.body }}</p>

      <aside v-if="sheet.pencilNotes?.length" class="pencil-block">
        <p
          v-for="(note, i) in sheet.pencilNotes"
          :key="i"
          class="note-pencil"
          :style="{ '--rot': `${(i % 2 === 0 ? -1.2 : 1.1) + i * 0.15}deg` }"
        >
          {{ note }}
        </p>
      </aside>

      <SchemaTable v-if="sheet.schema" :schema="sheet.schema" />

      <div v-if="sheet.chips?.length" class="chips">
        <span v-for="c in sheet.chips" :key="c" class="chip-label">{{ c }}</span>
      </div>

      <div v-if="sheet.exercises?.length" class="sheet__exercises">
        <ExerciseCard
          v-for="ex in sheet.exercises"
          :key="ex.id"
          :exercise="ex"
          :lesson-id="lessonId"
        />
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.sheet {
  position: relative;
  min-height: min(62vh, 560px);
  padding: 0.35rem 0.25rem 1rem 0.15rem;
}

.sheet__margin {
  position: absolute;
  left: 0.15rem;
  top: 0.15rem;
  bottom: 0.15rem;
  width: 2px;
  background: color-mix(in srgb, var(--margin-line) 75%, transparent);
  border-radius: 2px;
}

.sheet__content {
  padding-left: 1rem;
}

.sheet__type {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-soft);
  margin-bottom: 0.2rem;
}

.sheet__body {
  white-space: pre-wrap;
}

.pencil-block {
  margin: 0.85rem 0 1rem;
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  background: rgba(255, 252, 245, 0.65);
  border: 1px dashed rgba(210, 194, 175, 0.9);
}

.pencil-block .note-pencil {
  display: block;
  margin: 0.15rem 0;
  transform: rotate(var(--rot, -1deg));
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.75rem 0;
}

.chip-label {
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 0.85rem;
}
</style>
