import type { ReactElement, ReactNode } from 'react'
import { Menu } from '@base-ui/react/menu'
import { Check } from 'lucide-react'
import { useOverlayContainer } from './use-overlay-container'

const itemClassName = 'flex min-h-11 cursor-pointer items-center gap-3 rounded-control font-medium transition-colors motion-reduce:transition-none px-3 py-2 text-sm outline-none data-disabled:cursor-not-allowed data-disabled:opacity-40'

export function DropdownMenu({ trigger, children, align = 'start', className = 'w-60' }: Readonly<{ trigger: ReactElement; children: ReactNode; align?: 'start' | 'end'; className?: string }>) {
  const container = useOverlayContainer()
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger render={trigger} />
      <Menu.Portal container={container}>
        <Menu.Positioner align={align} sideOffset={8} collisionPadding={12} className="z-70">
          <Menu.Popup className={`max-w-(--available-width) max-h-(--available-height) overflow-y-auto overscroll-contain rounded-card border border-solid border-line bg-panel p-2 font-sans text-body shadow-surface outline-none origin-(--transform-origin) transition-[opacity,translate,scale] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] data-[starting-style]:-translate-y-1.5 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:-translate-y-1.5 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:duration-150 data-[ending-style]:ease-in motion-reduce:transition-none ${className}`}>{children}</Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

export function DropdownMenuItem({ children, icon, onClick, disabled, destructive = false }: Readonly<{ children: ReactNode; icon?: ReactNode; onClick?: () => void; disabled?: boolean; destructive?: boolean }>) {
  return <Menu.Item onClick={onClick} disabled={disabled} className={`${itemClassName} ${destructive ? 'text-negative data-highlighted:bg-negative-surface' : 'text-ink data-highlighted:bg-brand-soft data-highlighted:text-brand'}`}>{icon && <span aria-hidden="true" className="inline-flex shrink-0">{icon}</span>}{children}</Menu.Item>
}

export function DropdownMenuCheckboxItem({ children, checked, onCheckedChange, disabled }: Readonly<{ children: ReactNode; checked: boolean; onCheckedChange: (checked: boolean) => void; disabled?: boolean }>) {
  return <Menu.CheckboxItem checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} className={`${itemClassName} text-ink data-highlighted:bg-brand-soft data-highlighted:text-brand`}><span className="inline-flex size-4 shrink-0 items-center justify-center"><Menu.CheckboxItemIndicator><Check size={16} aria-hidden="true" /></Menu.CheckboxItemIndicator></span>{children}</Menu.CheckboxItem>
}

export function DropdownMenuGroup({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return <Menu.Group><Menu.GroupLabel className="px-3 pt-3 pb-2 text-xs font-semibold text-body">{label}</Menu.GroupLabel>{children}</Menu.Group>
}

export function DropdownMenuSeparator() {
  return <Menu.Separator className="mx-2 my-1.5 h-px bg-line" />
}
