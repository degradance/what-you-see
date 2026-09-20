import { readonly, ref } from 'vue'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'wys-theme'

// index.html applies the saved theme before first paint.
const theme = ref<Theme>(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

function set(next: Theme) {
  theme.value = next
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Storage can be blocked; the choice then simply does not persist.
  }
}

export function useTheme() {
  return {
    theme: readonly(theme),
    set,
    toggle: () => set(theme.value === 'dark' ? 'light' : 'dark'),
  }
}
