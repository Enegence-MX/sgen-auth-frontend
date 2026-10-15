import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, eyebrow, actions }: Readonly<PageHeaderProps>) {
  return (
    <header className="flex min-w-0 flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1 basis-64">
        {eyebrow && <p className="mt-0 mb-2 text-xs font-bold tracking-widest text-brand uppercase">{eyebrow}</p>}
        <h1 className="m-0 font-heading text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description && <p className="mt-3 mb-0 max-w-3xl text-sm leading-relaxed text-body">{description}</p>}
      </div>
      {actions && <div className="flex max-w-full flex-wrap items-center gap-3">{actions}</div>}
    </header>
  )
}
