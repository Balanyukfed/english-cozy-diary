<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useData } from '@/composables/useData'
import { usePageTurn } from '@/composables/usePageTurn'
import LessonSheetView from '@/components/diary/LessonSheetView.vue'
import type { Lesson } from '@/types'

const route = useRoute()
const router = useRouter()
const { loadCore, loadLesson, listOpenLessons, sprint } = useData()

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
  const q = String(route.query.lesson || 'S1')
  lessonId.value = lessons.value.some((l) => l.id === q) ? q : lessons.value[0]?.id ?? 'S1'
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
          'is-locked': l.status === 'todo' && l.id !== 'S1',
        }"
        :disabled="l.status === 'todo' && l.id !== 'S1' && !lessons.find((x) => x.id === l.id)"
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
  padding-bottom: 0.5rem;
  margin-bottom: 0.75rem;
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
