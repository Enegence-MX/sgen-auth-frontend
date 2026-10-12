import { ChevronLeft, ChevronRight, Ellipsis } from 'lucide-react'
import { Button } from './Button'

interface PaginationProps {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  variant?: 'numbered' | 'compact'
  disabled?: boolean
  controls?: string
  labels: {
    navigation: string
    previous: string
    next: string
    page: (page: number) => string
    status: (page: number, pageCount: number) => string
  }
}

function pageItems(page: number, count: number): (number | 'start-gap' | 'end-gap')[] {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1)
  const start = page <= 4 ? 2 : Math.min(page - 1, count - 4)
  const end = page >= count - 3 ? count - 1 : Math.max(page + 1, 5)
  const items: (number | 'start-gap' | 'end-gap')[] = [1]
  if (start > 2) items.push('start-gap')
  for (let number = start; number <= end; number += 1) items.push(number)
  if (end < count - 1) items.push('end-gap')
  return [...items, count]
}

export function Pagination({ page, pageCount, onPageChange, variant = 'numbered', disabled = false, controls, labels }: Readonly<PaginationProps>) {
  const count = Math.max(0, Math.trunc(pageCount))
  const current = count === 0 ? 0 : Math.max(1, Math.min(Math.trunc(page), count))
  return (
    <nav aria-label={labels.navigation} className="flex flex-wrap items-center justify-center gap-1.5">
      <Button size="icon" variant="secondary" aria-label={labels.previous} aria-controls={controls} disabled={disabled || current <= 1} onClick={() => onPageChange(current - 1)}><ChevronLeft size={18} aria-hidden="true" /></Button>
      {variant === 'numbered' && (
        <div className="hidden items-center gap-1.5 sm:flex">
          {pageItems(current, count).map((item) => typeof item === 'number' ? (
            <Button key={item} size="sm" variant={item === current ? 'primary' : 'ghost'} disabled={disabled} aria-label={labels.page(item)} aria-current={item === current ? 'page' : undefined} aria-controls={controls} onClick={() => { if (item !== current) onPageChange(item) }} className="h-11 min-w-11 shrink-0 px-2 py-0 text-sm tabular-nums">{item}</Button>
          ) : <span key={item} aria-hidden="true" className="inline-flex size-8 items-center justify-center text-body"><Ellipsis size={18} /></span>)}
        </div>
      )}
      <span aria-hidden="true" className={`min-w-20 px-2 text-center text-sm tabular-nums ${variant === 'numbered' && count > 0 ? 'sm:hidden' : ''}`}><span className="font-semibold text-ink">{current}</span><span className="px-2 text-body">/</span>{count}</span>
      <Button size="icon" variant="secondary" aria-label={labels.next} aria-controls={controls} disabled={disabled || current >= count} onClick={() => onPageChange(current + 1)}><ChevronRight size={18} aria-hidden="true" /></Button>
      <span role="status" aria-atomic="true" className="sr-only">{labels.status(current, count)}</span>
    </nav>
  )
}
