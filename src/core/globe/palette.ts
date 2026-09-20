export interface Palette {
  ink: string
  muted: string
  line: string
  signal: string
  warn: string
  surface: string
  surface2: string
}

// Canvas cannot resolve `var()`, so the CSS tokens are read once per theme instead of duplicating the colours in TS.
export function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement)
  const token = (name: string) => style.getPropertyValue(`--${name}`).trim()
  return {
    ink: token('ink'),
    muted: token('muted'),
    line: token('line'),
    signal: token('signal'),
    warn: token('warn'),
    surface: token('surface'),
    surface2: token('surface-2'),
  }
}
