import { LoaderCircle } from 'lucide-react'
import { Progress as BaseProgress } from '@base-ui/react/progress'

export function Spinner({ label, size = 'md' }: Readonly<{ label: string; size?: 'sm' | 'md' | 'lg' }>) {
  const sizes = { sm: 16, md: 24, lg: 36 }
  return <span role="status" className="inline-flex items-center justify-center text-brand"><LoaderCircle size={sizes[size]} aria-hidden="true" className="animate-spin motion-reduce:animate-none" /><span className="sr-only">{label}</span></span>
}

export function Skeleton({ className = '' }: Readonly<{ className?: string }>) {
  return <div aria-hidden="true" className={`animate-pulse rounded-control bg-linear-to-r from-line via-line-soft to-line motion-reduce:animate-none ${className}`} />
}

export function Progress({ label, value }: Readonly<{ label: string; value: number | null }>) {
  return (
    <BaseProgress.Root value={value} className="grid gap-3">
      <div className="flex items-center justify-between gap-3 text-sm"><BaseProgress.Label className="font-medium text-ink">{label}</BaseProgress.Label>{value !== null && <BaseProgress.Value className="font-semibold text-brand tabular-nums" />}</div>
      <BaseProgress.Track className="h-2.5 overflow-hidden rounded-full bg-subtle ring-1 ring-inset ring-line">
        <BaseProgress.Indicator className={`h-full rounded-full bg-linear-to-r from-brand-hover to-brand transition-[width] duration-300 motion-reduce:transition-none ${value === null ? 'w-1/3 animate-pulse motion-reduce:animate-none' : ''}`} />
      </BaseProgress.Track>
    </BaseProgress.Root>
  )
}
