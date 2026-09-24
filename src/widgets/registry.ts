import type { Component } from 'vue'

export interface WidgetDef {
  id: string
  exhibit: string
  // One word for the navigation bar, where the full question does not fit.
  short: string
  title: string
  subtitle: string
  // Size on the board in grid cells; below the `lg` breakpoint every card is a single full-width cell.
  span: 1 | 2
  rows: 1 | 2
  load: () => Promise<{ default: Component }>
}

export const defineWidget = (def: WidgetDef): WidgetDef => def
