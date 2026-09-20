import type { Component } from 'vue'

export interface WidgetDef {
  id: string
  exhibit: string
  title: string
  subtitle: string
  stamp: string
  span: 1 | 2
  load: () => Promise<{ default: Component }>
}

export const defineWidget = (def: WidgetDef): WidgetDef => def
