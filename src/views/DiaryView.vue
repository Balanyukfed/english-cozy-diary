<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useData } from '@/composables/useData'
import { usePageTurn } from '@/composables/usePageTurn'
import { buildTeacherReport } from '@/composables/useAnswers'
import LessonSheetView from '@/components/diary/LessonSheetView.vue'
import type { Lesson } from '@/types'

const route = useRoute()
const router = useRouter()
const { loadCore, loadLesson, listOpenLessons, sprint, meta } = useData()

const lessons = ref<Lesson[]>([])
const lessonId = ref('S1')
const current = computed(() => lessons.value.find((l) => l.id === lessonId.value) ?? null)
const sheetsLen = computed(() => current.value?.sheets.length ?? 0)
const {
  index: sheetIndex,
  direction,
  canPrev,
  canNext,
  next,
  prev,
  go,
  onPointerDown,
  onPointerUp,
} = usePageTurn(sheetsLen)
const bookEl = ref<HTMLElement | null>(null)

onMounted(async () => {
  await loadCore()
  lessons.value = await listOpenLessons()
  const preferred = String(route.query.lesson || meta.value?.nextLessonId || 'S1')
  lessonId.value = lessons.value.some((l) => l.id === preferred)
    ? preferred
    : lessons.value.find((l) => l.status === 'current')?.id ?? lessons.value[0]?.id ?? 'S1'
  const lesson = await loadLesson(lessonId.value)
  if (lesson && !lessons.value.find((l) => l.id === lesson.id)) {
    lessons.value.push(lesson)
  }
})

watch(bookEl, (el) => {
  if (!el) return
  el.addEventListener('pointerdown', onPointerDown)
  el.addEventListener('pointerup', onPointerUp)
})

watch(lessonId, async (id) => {
  go(0)
  await loadLesson(id)
  router.replace({ query: { ...route.query, lesson: id } })
})

const sheet = computed(() => current.value?.sheets[sheetIndex.value] ?? null)

const allSprintLessons = computed(
  () => sprint.value?.flatMap((b) => b.lessons) ?? [],
)

const reportStatus = ref('')

async function copyTeacherReport() {
  if (!current.value) return
  const text = buildTeacherReport(current.value)
  try {
    await navigator.clipboard.writeText(text)
    reportStatus.value = 'Отчёт скопирован — вставь в чат'
  } catch {
    reportStatus.value = 'Не удалось скопировать — выдели текст вручную'
    window.prompt('Скопируй отчёт:', text)
  }
  window.setTimeout(() => {
    reportStatus.value = ''
  }, 3500)
}
</script>

<template>
  <section class="diary">
    <header class="diary__head">
      <h1>Тетрадь</h1>
    </header>

    <div class="toc no-swipe">
      <button
        v-for="l in allSprintLessons"
        :key="l.id"
        type="button"
        class="toc__item"
        :class="{
          'is-active': l.id === lessonId,
          'is-locked': l.status === 'todo',
        }"
        :disabled="l.status === 'todo'"
        @click="lessonId = l.id"
      >
        {{ l.id }}
      </button>
    </div>

    <p v-if="current" class="diary__title">
      <strong>{{ current.id }}</strong> — {{ current.title }}
    </p>

    <div ref="bookEl" class="book">
      <Transition :name="direction === 'next' ? 'page-next' : 'page-prev'" mode="out-in">
        <LessonSheetView
          v-if="sheet && current"
          :key="sheet.id"
          :sheet="sheet"
          :lesson-id="current.id"
        />
      </Transition>
    </div>

    <div class="pager no-swipe">
      <button type="button" class="btn btn--ghost" :disabled="!canPrev" @click="prev">
        ‹ Назад
      </button>
      <span class="pager__n">
        {{ sheetIndex + 1 }} / {{ sheetsLen || 1 }}
      </span>
      <button type="button" class="btn btn--ghost" :disabled="!canNext" @click="next">
        Вперёд ›
      </button>
    </div>

    <div class="report no-swipe">
      <button type="button" class="btn btn--soft btn--report" @click="copyTeacherReport">
        Скопировать отчёт учителю
      </button>
      <p class="report__hint">
        Ошибки (даже исправленные) + твои заметки. После «урок прошли» / «дз сделал» — вставь в чат.
      </p>
      <p v-if="reportStatus" class="report__status">{{ reportStatus }}</p>
    </div>
  </section>
</template>

<style scoped lang="scss">
.diary__head {
  margin-bottom: 0.75rem;
}

.toc {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  padding-bottom: 0.35rem;
  margin-bottom: 0.65rem;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.toc__item {
  flex: 0 0 auto;
  min-height: 40px;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(201, 184, 168, 0.8);
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;

  &.is-active {
    background: var(--accent-soft);
    border-color: var(--accent);
    font-weight: 700;
  }

  &.is-locked:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.diary__title {
  margin-bottom: 0.75rem;
}

.book {
  min-height: 420px;
  touch-action: pan-y;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 1rem;
}

.pager__n {
  color: var(--ink-soft);
  font-weight: 600;
}

.report {
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px dashed rgba(201, 184, 168, 0.65);
}

.btn--report {
  min-height: 40px;
  padding: 0.5rem 0.95rem;
  font-size: 0.9rem;
}

.report__hint {
  margin: 0.45rem 0 0;
  font-size: 0.8rem;
  color: var(--ink-soft);
  line-height: 1.4;
}

.report__status {
  margin: 0.35rem 0 0;
  font-size: 0.85rem;
  color: var(--ok);
  font-weight: 600;
}

.page-next-enter-active,
.page-next-leave-active,
.page-prev-enter-active,
.page-prev-leave-active {
  transition: transform 0.35s ease, opacity 0.35s ease;
}

.page-next-enter-from {
  transform: rotateY(-12deg) translateX(24px);
  opacity: 0;
}
.page-next-leave-to {
  transform: rotateY(10deg) translateX(-18px);
  opacity: 0;
}
.page-prev-enter-from {
  transform: rotateY(12deg) translateX(-24px);
  opacity: 0;
}
.page-prev-leave-to {
  transform: rotateY(-10deg) translateX(18px);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .page-next-enter-from,
  .page-next-leave-to,
  .page-prev-enter-from,
  .page-prev-leave-to {
    transform: none;
  }
}
</style>
