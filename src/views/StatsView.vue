<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useStats } from '@/composables/useStats'

const { ready, lessonStats, totals, focusTopics, warnCards, drillIdeas, refresh } = useStats()

onMounted(() => {
  void refresh()
})

function barClass(pct: number | null) {
  if (pct == null) return 'is-empty'
  if (pct >= 85) return 'is-good'
  if (pct >= 70) return 'is-ok'
  return 'is-low'
}

const priorityLabel: Record<string, string> = {
  high: 'срочно',
  medium: 'важно',
  low: 'следить',
  done: 'закрыто',
}
</script>

<template>
  <section class="stats">
    <header class="stats__head">
      <h1>Успеваемость</h1>
      <p class="hint">
        Считается по твоим ответам в тетради на этом устройстве: что сейчас верно, и что ошибался
        хотя бы раз.
      </p>
      <button type="button" class="refresh" @click="refresh">Обновить</button>
    </header>

    <template v-if="ready">
      <div class="overview">
        <article class="metric">
          <p class="metric__label">Сейчас верно</p>
          <p class="metric__value">
            {{ totals.accuracyPct == null ? '—' : `${totals.accuracyPct}%` }}
          </p>
          <p class="metric__sub">
            {{ totals.correctNow }} / {{ totals.checked }} проверенных
          </p>
        </article>
        <article class="metric">
          <p class="metric__label">С первого раза</p>
          <p class="metric__value">
            {{ totals.firstTryPct == null ? '—' : `${totals.firstTryPct}%` }}
          </p>
          <p class="metric__sub">без записи в лог ошибок</p>
        </article>
        <article class="metric">
          <p class="metric__label">Уроки</p>
          <p class="metric__value">{{ totals.progressLessons }}/{{ totals.totalLessons }}</p>
          <p class="metric__sub">в спринте · трогал {{ totals.lessonsTouched }}</p>
        </article>
        <article class="metric">
          <p class="metric__label">Сигналы</p>
          <p class="metric__value">{{ totals.everWrong }}</p>
          <p class="metric__sub">
            заданий с ошибкой в логе · заметок {{ totals.notes }} · карточек «повтор»
            {{ warnCards }}
          </p>
        </article>
      </div>

      <section class="block">
        <h2>Темы в фокусе</h2>
        <p v-if="!focusTopics.length" class="hint">Пока пусто — weak spots подтянутся после уроков.</p>
        <ul v-else class="topics">
          <li v-for="t in focusTopics" :key="t.id" class="topic" :data-p="t.priority">
            <span class="topic__p">{{ priorityLabel[t.priority] }}</span>
            <div>
              <p class="topic__name">{{ t.topic }}</p>
              <p class="topic__why">{{ t.why }}</p>
            </div>
          </li>
        </ul>
        <RouterLink class="linkish" to="/weak">Открыть «Хромает»</RouterLink>
      </section>

      <section class="block">
        <h2>По урокам</h2>
        <div v-if="!lessonStats.length" class="hint">Пока нет данных — реши что-нибудь в тетради.</div>
        <div v-else class="lessons">
          <article v-for="row in lessonStats" :key="row.id" class="lesson-row">
            <header class="lesson-row__head">
              <strong>{{ row.id }}</strong>
              <span class="lesson-row__title">{{ row.title }}</span>
              <span class="lesson-row__status">{{ row.status }}</span>
            </header>
            <p class="lesson-row__nums">
              проверено {{ row.checked }}/{{ row.total }} · верно сейчас
              {{ row.accuracyPct == null ? '—' : `${row.accuracyPct}%` }} · с первого раза
              {{ row.firstTryPct == null ? '—' : `${row.firstTryPct}%` }} · лог ошибок
              {{ row.everWrong }}
            </p>
            <div class="bars">
              <div class="bar">
                <span>сейчас</span>
                <div class="bar__track">
                  <div
                    class="bar__fill"
                    :class="barClass(row.accuracyPct)"
                    :style="{ width: `${row.accuracyPct ?? 0}%` }"
                  />
                </div>
              </div>
              <div class="bar">
                <span>1-й раз</span>
                <div class="bar__track">
                  <div
                    class="bar__fill"
                    :class="barClass(row.firstTryPct)"
                    :style="{ width: `${row.firstTryPct ?? 0}%` }"
                  />
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="block block--soft">
        <h2>Доп. практика</h2>
        <p class="hint">
          Дальше учитель сможет сам генерировать мини-листы под эти темы. Пока — список приоритетов;
          в чате можно сразу написать команду.
        </p>
        <ul class="drills">
          <li v-for="d in drillIdeas" :key="d.id" class="drill">
            <p class="drill__topic">{{ d.topic }}</p>
            <p class="drill__reason">{{ d.reason }}</p>
            <p class="drill__cmd">{{ d.chatHint }}</p>
          </li>
        </ul>
        <p v-if="!drillIdeas.length" class="hint">Пока рекомендаций нет.</p>
      </section>
    </template>
  </section>
</template>

<style scoped lang="scss">
.stats__head {
  margin-bottom: 1rem;
}

.hint {
  color: var(--ink-soft);
  font-size: 0.85rem;
  line-height: 1.45;
  margin: 0.25rem 0 0.65rem;
}

.refresh {
  border: 1px solid rgba(106, 101, 88, 0.35);
  background: transparent;
  border-radius: 999px;
  min-height: 36px;
  padding: 0.35rem 0.85rem;
  cursor: pointer;
  font: inherit;
  font-size: 0.85rem;
}

.overview {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
  margin-bottom: 1.15rem;
}

.metric {
  padding: 0.75rem 0.85rem;
  border-radius: 12px;
  background: rgba(255, 252, 245, 0.65);
  border: 1px solid rgba(210, 194, 175, 0.55);
}

.metric__label {
  margin: 0;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-soft);
}

.metric__value {
  margin: 0.2rem 0 0.15rem;
  font-family: var(--font-display);
  font-size: 1.55rem;
  line-height: 1.1;
}

.metric__sub {
  margin: 0;
  font-size: 0.75rem;
  color: var(--ink-soft);
  line-height: 1.35;
}

.block {
  margin-bottom: 1.25rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px dashed rgba(201, 184, 168, 0.55);

  h2 {
    font-size: 1.1rem;
    margin-bottom: 0.45rem;
  }
}

.block--soft {
  border-bottom: none;
  background: rgba(95, 111, 94, 0.06);
  border-radius: 14px;
  padding: 0.85rem 0.95rem;
}

.topics {
  list-style: none;
  margin: 0;
  padding: 0;
}

.topic {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.55rem;
  padding: 0.55rem 0;
  border-bottom: 1px dashed rgba(201, 184, 168, 0.4);

  &:last-child {
    border-bottom: none;
  }
}

.topic__p {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-soft);
  padding-top: 0.15rem;
}

.topic[data-p='high'] .topic__p {
  color: var(--bad);
}

.topic__name {
  margin: 0 0 0.15rem;
  font-weight: 650;
}

.topic__why {
  margin: 0;
  font-size: 0.82rem;
  color: var(--ink-soft);
}

.linkish {
  display: inline-block;
  margin-top: 0.45rem;
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
}

.lesson-row {
  padding: 0.7rem 0;
  border-bottom: 1px dashed rgba(201, 184, 168, 0.45);

  &:last-child {
    border-bottom: none;
  }
}

.lesson-row__head {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.55rem;
  align-items: baseline;
  margin-bottom: 0.25rem;
}

.lesson-row__title {
  color: var(--ink);
}

.lesson-row__status {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--ink-soft);
}

.lesson-row__nums {
  margin: 0 0 0.45rem;
  font-size: 0.8rem;
  color: var(--ink-soft);
  line-height: 1.4;
}

.bars {
  display: grid;
  gap: 0.3rem;
}

.bar {
  display: grid;
  grid-template-columns: 3.5rem 1fr;
  gap: 0.4rem;
  align-items: center;
  font-size: 0.72rem;
  color: var(--ink-soft);
}

.bar__track {
  height: 6px;
  border-radius: 999px;
  background: rgba(201, 184, 168, 0.35);
  overflow: hidden;
}

.bar__fill {
  height: 100%;
  border-radius: 999px;
  background: var(--accent);

  &.is-good {
    background: var(--ok);
  }
  &.is-ok {
    background: color-mix(in srgb, var(--ok) 55%, var(--sticker-butter));
  }
  &.is-low {
    background: var(--bad);
  }
  &.is-empty {
    width: 0 !important;
  }
}

.drills {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
}

.drill {
  padding: 0.55rem 0;
  border-bottom: 1px dashed rgba(201, 184, 168, 0.4);

  &:last-child {
    border-bottom: none;
  }
}

.drill__topic {
  margin: 0 0 0.15rem;
  font-weight: 650;
}

.drill__reason {
  margin: 0 0 0.2rem;
  font-size: 0.82rem;
  color: var(--ink-soft);
}

.drill__cmd {
  margin: 0;
  font-size: 0.85rem;
  font-family: var(--font-display);
}

@media (min-width: 720px) {
  .overview {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
