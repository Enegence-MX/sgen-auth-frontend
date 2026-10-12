import type { ReactElement, ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { useOverlayContainer } from './use-overlay-container'

interface ModalProps {
  trigger: ReactElement
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  closeLabel: string
  children?: ReactNode
  footer?: ReactNode
}

export function Modal({ trigger, open, onOpenChange, title, description, closeLabel, children, footer }: Readonly<ModalProps>) {
  const container = useOverlayContainer()
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger render={trigger} />
      <Dialog.Portal container={container}>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-navy/55 backdrop-blur-[3px]" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-hidden -translate-x-1/2 -translate-y-1/2 flex-col rounded-card border border-solid border-line bg-panel font-sans text-body shadow-surface focus:outline-none">
          <div className="relative shrink-0 border-0 border-b border-solid border-line p-5 pr-16 sm:p-6 sm:pr-16">
            <Dialog.Title className="m-0 font-heading text-xl font-semibold text-ink">{title}</Dialog.Title>
            {description && <Dialog.Description className="mt-3 mb-0 text-sm leading-relaxed">{description}</Dialog.Description>}
            <Dialog.Close aria-label={closeLabel} className="absolute top-3 right-3 inline-flex size-11 cursor-pointer items-center justify-center rounded-control border-0 bg-transparent text-body hover:bg-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"><X size={19} aria-hidden="true" /></Dialog.Close>
          </div>
          {children && <div className="min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6">{children}</div>}
          {footer && <div className="flex shrink-0 flex-wrap justify-end gap-2 rounded-b-card bg-subtle/60 border-0 border-t border-solid border-line p-5 sm:px-6">{footer}</div>}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
