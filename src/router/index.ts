import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'today', component: () => import('@/views/TodayView.vue') },
    { path: '/diary', name: 'diary', component: () => import('@/views/DiaryView.vue') },
    { path: '/words', name: 'words', component: () => import('@/views/WordsView.vue') },
    { path: '/tenses', name: 'tenses', component: () => import('@/views/TensesView.vue') },
    { path: '/sprint', name: 'sprint', component: () => import('@/views/SprintView.vue') },
    { path: '/stats', name: 'stats', component: () => import('@/views/StatsView.vue') },
    { path: '/journal', name: 'journal', component: () => import('@/views/JournalView.vue') },
    { path: '/weak', name: 'weak', component: () => import('@/views/WeakSpotsView.vue') },
    { path: '/help', name: 'help', component: () => import('@/views/HelpView.vue') },
    { path: '/more', name: 'more', component: () => import('@/views/MoreView.vue') },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
