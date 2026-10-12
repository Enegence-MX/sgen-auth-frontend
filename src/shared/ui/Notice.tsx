import type { HTMLAttributes } from 'react'

interface NoticeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'neutral' | 'warning' | 'success' | 'error'
}

const variants = {
  neutral: 'border-brand/15 bg-brand-soft text-brand',
  warning: 'border-caution/20 bg-caution-surface text-caution',
  error: 'border-negative/20 bg-negative-surface text-negative',
  success: 'border-positive/20 bg-positive-surface text-positive',
}

export function Notice({ children, className = '', variant = 'neutral', ...props }: Readonly<NoticeProps>) {
  return (
    <div {...props} className={`rounded-control border border-solid p-4 leading-relaxed ${variants[variant]} ${className}`}>
      {children}
    </div>
  )
}
