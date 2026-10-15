import type { ReactNode } from 'react'
import { Tabs as BaseTabs } from '@base-ui/react/tabs'

interface TabItem {
  value: string
  label: ReactNode
  content: ReactNode
  disabled?: boolean
}

interface TabsProps {
  label: string
  items: readonly TabItem[]
  variant?: 'underline' | 'segmented'
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

export function Tabs({ label, items, variant = 'underline', defaultValue, value, onValueChange }: Readonly<TabsProps>) {
  const segmented = variant === 'segmented'
  return (
    <BaseTabs.Root className="min-w-0 max-w-full" defaultValue={defaultValue ?? items.find((item) => !item.disabled)?.value} value={value} onValueChange={(next) => { if (typeof next === 'string') onValueChange?.(next) }}>
      <BaseTabs.List aria-label={label} activateOnFocus className={`flex max-w-full gap-1 overflow-x-auto overscroll-x-contain [scrollbar-width:thin] ${segmented ? 'rounded-xl border border-solid border-line bg-subtle p-1' : 'border-0 border-b border-solid border-line'}`}>
        {items.map((item) => <BaseTabs.Tab key={item.value} value={item.value} disabled={item.disabled} className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 px-4 py-3 font-sans text-sm font-semibold whitespace-nowrap text-body outline-none transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand data-disabled:cursor-not-allowed data-disabled:opacity-40 motion-reduce:transition-none ${segmented ? 'flex-1 rounded-control border-0 bg-transparent hover:text-ink data-active:bg-panel data-active:text-brand data-active:shadow-control data-active:ring-1 data-active:ring-line' : 'border-0 border-b-2 border-solid border-transparent bg-transparent rounded-t-control hover:bg-subtle data-active:bg-brand-soft/70 data-active:border-brand data-active:text-brand'}`}>{item.label}</BaseTabs.Tab>)}
      </BaseTabs.List>
      {items.map((item) => <BaseTabs.Panel key={item.value} value={item.value} className="mt-5 rounded-control outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">{item.content}</BaseTabs.Panel>)}
    </BaseTabs.Root>
  )
}
