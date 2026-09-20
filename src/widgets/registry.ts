import type { Component } from 'vue'

export interface WidgetDef {
  id: string
  exhibit: string
  title: string
  subtitle: string
  stamp: string
  // Size on the board in grid cells; below the `lg` breakpoint every card is a single full-width cell.
  span: 1 | 2
  rows: 1 | 2
  load: () => Promise<{ default: Component }>
}

export const defineWidget = (def: WidgetDef): WidgetDef => def
