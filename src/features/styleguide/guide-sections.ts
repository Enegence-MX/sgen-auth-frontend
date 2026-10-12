import { ArrowLeftRight, Bell, Blocks, ChartNoAxesCombined, Grid2X2, ListChecks, ListCollapse, LoaderCircle, MessageSquare, Palette, PanelTop, PanelsTopLeft, Search, Shapes, Table2, TextCursorInput, Type } from 'lucide-react'

export const guideGroups = ['appearanceGroup', 'formsGroup', 'componentsGroup', 'feedbackGroup'] as const

export const guideSections = [
  { id: 'palette', group: 'appearanceGroup', Icon: Palette, keywords: 'colores colors' },
  { id: 'typography', group: 'appearanceGroup', Icon: Type, keywords: 'fuentes fonts espaciado' },
  { id: 'icons', group: 'appearanceGroup', Icon: Shapes, keywords: 'lucide iconos icons simbolos' },
  { id: 'layouts', group: 'appearanceGroup', Icon: Grid2X2, keywords: 'grid responsive tarjetas' },
  { id: 'fields', group: 'formsGroup', Icon: TextCursorInput, keywords: 'input textarea textfield select' },
  { id: 'searchSelects', group: 'formsGroup', Icon: Search, keywords: 'combobox select busqueda filtros multiselect' },
  { id: 'selection', group: 'formsGroup', Icon: ListChecks, keywords: 'checkbox radio toggle switch' },
  { id: 'components', group: 'componentsGroup', Icon: Blocks, keywords: 'boton button badge avisos formulario' },
  { id: 'tables', group: 'componentsGroup', Icon: Table2, keywords: 'table registros' },
  { id: 'charts', group: 'componentsGroup', Icon: ChartNoAxesCombined, keywords: 'chartjs charts graficas graficos datos barras lineas dona radar' },
  { id: 'pagination', group: 'componentsGroup', Icon: ArrowLeftRight, keywords: 'paginacion paginas' },
  { id: 'tabs', group: 'componentsGroup', Icon: PanelsTopLeft, keywords: 'tabs pestanas' },
  { id: 'menus', group: 'componentsGroup', Icon: ListCollapse, keywords: 'dropdown acciones opciones' },
  { id: 'tooltips', group: 'feedbackGroup', Icon: MessageSquare, keywords: 'ayuda tooltip' },
  { id: 'modals', group: 'feedbackGroup', Icon: PanelTop, keywords: 'modal dialog ventana' },
  { id: 'toasts', group: 'feedbackGroup', Icon: Bell, keywords: 'toast notificaciones' },
  { id: 'loadingStates', group: 'feedbackGroup', Icon: LoaderCircle, keywords: 'loading skeleton spinner progreso carga' },
] as const

export type GuideSectionId = typeof guideSections[number]['id']

export function normalizeGuideSearch(text: string) {
  return text.normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}
