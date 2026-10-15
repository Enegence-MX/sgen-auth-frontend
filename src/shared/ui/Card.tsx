import type { HTMLAttributes } from 'react'

export function Card({ children, className = '', ...props }: Readonly<HTMLAttributes<HTMLDivElement>>) {
  return <div {...props} className={`min-w-0 rounded-card border border-solid border-line bg-panel shadow-card p-5 sm:p-6 ${className}`}>{children}</div>
}
