import type { HTMLAttributes } from 'react'

const variants = {
  neutral: 'border-line bg-subtle text-body',
  brand: 'border-brand/15 bg-brand-soft text-brand',
  success: 'border-positive/15 bg-positive-surface text-positive',
  warning: 'border-caution/15 bg-caution-surface text-caution',
  error: 'border-negative/15 bg-negative-surface text-negative',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants
}

export function Badge({ variant = 'neutral', className = '', children, ...props }: Readonly<BadgeProps>) {
  return <span {...props} className={`inline-flex items-center gap-1.5 rounded-full border border-solid px-2.5 py-1 leading-4 text-xs font-semibold ${variants[variant]} ${className}`}>{children}</span>
}
