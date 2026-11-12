import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'

export function usePageTurn(length: Ref<number>, initial = 0) {
  const index = ref(initial)
  const direction = ref<'next' | 'prev'>('next')

  const canPrev = computed(() => index.value > 0)
  const canNext = computed(() => index.value < length.value - 1)

  function go(to: number) {
    if (to < 0 || to >= length.value) return
    direction.value = to > index.value ? 'next' : 'prev'
    index.value = to
  }

  function next() {
    if (canNext.value) go(index.value + 1)
  }

  function prev() {
    if (canPrev.value) go(index.value - 1)
  }

  let startX = 0
  let tracking = false

  function onPointerDown(e: PointerEvent) {
    const target = e.target as HTMLElement
    if (target.closest('input, textarea, button, a, .no-swipe')) return
    tracking = true
    startX = e.clientX
  }

  function onPointerUp(e: PointerEvent) {
    if (!tracking) return
    tracking = false
    const dx = e.clientX - startX
    if (Math.abs(dx) < 56) return
    if (dx < 0) next()
    else prev()
  }

  function bind(el: HTMLElement | null) {
    if (!el) return
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointerup', onPointerUp)
    onUnmounted(() => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointerup', onPointerUp)
    })
  }

  onMounted(() => {
    /* binding via template ref in component */
  })

  return { index, direction, canPrev, canNext, next, prev, go, bind, onPointerDown, onPointerUp }
}
