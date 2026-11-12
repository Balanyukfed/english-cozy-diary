# English Cozy Diary (PWA)

Уютный дневник + рабочая тетрадь английского. Vue 3 + Vite. Mobile-first.

## Локально

```bash
cd english/app
npm install
npm run dev -- --host
```

Открой URL с телефона в той же Wi‑Fi (Vite покажет Network-адрес).

## Сборка

```bash
npm run build
npm run preview -- --host
```

Статика в `dist/`.

## Деплой для iPhone (без ПК рядом)

Нужен **https**. Репозиторий: [Balanyukfed/english-cozy-diary](https://github.com/Balanyukfed/english-cozy-diary).

**Сайт:** https://balanyukfed.github.io/english-cozy-diary/

После каждого урока / ДЗ: `git push origin main` из этой папки → Actions собирает и выкладывает Pages (~1–2 мин).

В Safari: **Поделиться → На экран «Домой»**.

`base: './'` + hash-router — ок для project Pages.

## Данные уроков

`public/data/` — JSON. После урока репетитор обновляет:
- `lessons/S__.json` — листы + exercises с `explain`
- `vocab.json`, `tenses.json`, `journal.json`, `weak-spots.json`, `sprint.json`, `meta.json`

Ответы ученика — только в `localStorage` на телефоне.
