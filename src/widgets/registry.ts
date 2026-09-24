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
  // The widget's layout with its data blacked out. Eager and small: it stands in while the chunk loads,
  // and the widget keeps it until its first data, so the card is the same height throughout.
  skeleton: Component
}

export const defineWidget = (def: WidgetDef): WidgetDef => def
