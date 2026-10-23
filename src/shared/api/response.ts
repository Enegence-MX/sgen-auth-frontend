export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export interface Envelope<T> {
  data: T
}

export interface PageMeta {
  page: number
  pageSize: number
  total: number
}

export interface Page<T> {
  data: T[]
  meta: PageMeta
}
