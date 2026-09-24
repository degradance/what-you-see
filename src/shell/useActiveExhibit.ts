import { onBeforeUnmount, onMounted, ref } from 'vue'

// A card is current while it crosses a thin line just above the middle of the viewport. Side-by-side cards
// can cross it together, so the first one in board order wins; between cards the last answer stands.
export function useActiveExhibit(ids: readonly string[]) {
  const active = ref<string | undefined>()
  const crossing = new Set<string>()
  let observer: IntersectionObserver | undefined

  onMounted(() => {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) crossing.add(entry.target.id)
          else crossing.delete(entry.target.id)
        }
        const first = ids.find((id) => crossing.has(id))
        if (first) active.value = first
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
  })

  onBeforeUnmount(() => observer?.disconnect())

  return active
}
