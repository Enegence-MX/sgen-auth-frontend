import { useId, useState, type ReactElement, type ReactNode } from 'react'
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'
import { useOverlayContainer } from './use-overlay-container'

interface TooltipProps {
  children: ReactElement
  content: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ children, content, side = 'top' }: Readonly<TooltipProps>) {
  const container = useOverlayContainer()
  const id = useId()
  const [open, setOpen] = useState(false)
  return (
    <BaseTooltip.Provider delay={250}>
      <BaseTooltip.Root open={open} onOpenChange={setOpen}>
        <BaseTooltip.Trigger render={children} aria-describedby={open ? id : undefined} />
        <BaseTooltip.Portal container={container}>
          <BaseTooltip.Positioner side={side} sideOffset={8} collisionPadding={12} className="z-70">
            <BaseTooltip.Popup id={id} role="tooltip" className="max-w-[min(260px,calc(100vw-24px))] rounded-control border border-solid border-line bg-ink px-3 py-2 font-sans text-xs font-medium leading-relaxed text-panel shadow-surface origin-(--transform-origin) transition-[opacity,transform] duration-150 data-starting:scale-95 data-starting:opacity-0 data-ending:scale-95 data-ending:opacity-0 motion-reduce:transition-none">
              {content}
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  )
}
