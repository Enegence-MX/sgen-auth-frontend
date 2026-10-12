import type { TableHTMLAttributes } from 'react'

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  caption: string
}

export function Table({ caption, children, className = '', ...props }: Readonly<TableProps>) {
  return (
    <div role="region" aria-label={caption} tabIndex={0} className="max-w-full overflow-x-auto rounded-card border border-solid border-line bg-panel shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
      <table {...props} className={`w-full min-w-[580px] border-collapse text-left text-sm text-body [&_th]:px-5 [&_th]:py-3.5 [&_th]:font-semibold [&_th]:text-ink [&_td]:px-5 [&_td]:py-4 [&_td]:break-words [&_thead]:bg-subtle [&_tbody_tr]:border-0 [&_tbody_tr]:border-t [&_tbody_tr]:border-solid [&_tbody_tr]:border-line-soft [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-subtle [&_tbody_tr[data-selected=true]]:bg-brand-soft ${className}`}>
        <caption className="px-5 py-5 text-left font-heading font-semibold text-ink">{caption}</caption>
        {children}
      </table>
    </div>
  )
}
