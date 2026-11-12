export type NavItem = {
  to: string
  label: string
  short: string
  color: string
  match?: (path: string) => boolean
}

export const primaryNav: NavItem[] = [
  {
    to: '/',
    label: 'Сегодня',
    short: 'Сегодня',
    color: 'var(--sticker-coral)',
    match: (p) => p === '/',
  },
  {
    to: '/diary',
    label: 'Тетрадь',
    short: 'Тетрадь',
    color: 'var(--sticker-blush)',
    match: (p) => p.startsWith('/diary'),
  },
  {
    to: '/stats',
    label: 'Успеваемость',
    short: 'Статы',
    color: 'var(--sticker-moss)',
    match: (p) =>
      p.startsWith('/stats') || p.startsWith('/journal') || p.startsWith('/sprint'),
  },
  {
    to: '/words',
    label: 'Слова',
    short: 'Слова',
    color: 'var(--sticker-mist)',
    match: (p) => p === '/words' || p.startsWith('/words/'),
  },
  {
    to: '/tenses',
    label: 'Грамматика',
    short: 'Грамм.',
    color: 'var(--sticker-butter)',
    match: (p) => p.startsWith('/tenses'),
  },
  {
    to: '/weak',
    label: 'Слабые места',
    short: 'Хромает',
    color: 'var(--sticker-lilac)',
    match: (p) => p.startsWith('/weak'),
  },
  {
    to: '/help',
    label: 'Справка',
    short: 'Справка',
    color: 'var(--sticker-sage)',
    match: (p) => p.startsWith('/help') || p.startsWith('/more'),
  },
]

export const mobileNav: NavItem[] = [
  primaryNav[0],
  primaryNav[1],
  primaryNav[3],
  primaryNav[4],
  {
    to: '/more',
    label: 'Ещё',
    short: 'Ещё',
    color: 'var(--sticker-lilac)',
    match: (p) =>
      p.startsWith('/more') ||
      p.startsWith('/stats') ||
      p.startsWith('/journal') ||
      p.startsWith('/sprint') ||
      p.startsWith('/weak') ||
      p.startsWith('/help'),
  },
]
