import type { ReactNode } from 'react'
import { Toast as BaseToast } from '@base-ui/react/toast'
import { Check, CircleAlert, Info, X } from 'lucide-react'
import { useOverlayContainer } from './use-overlay-container'
import { useToasts } from './use-toasts'

const appearances = {
  success: { Icon: Check, className: 'bg-positive-surface text-positive' },
  error: { Icon: CircleAlert, className: 'bg-negative-surface text-negative' },
  info: { Icon: Info, className: 'bg-brand-soft text-brand' },
}

function ToastList({ label, closeLabel }: Readonly<{ label: string; closeLabel: string }>) {
  const { toasts } = useToasts()
  const container = useOverlayContainer()
  return (
    <BaseToast.Portal container={container}>
      <BaseToast.Viewport aria-label={label} className="pointer-events-none fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-60 flex max-h-[calc(100dvh-6rem)] w-[calc(100%-2rem)] max-w-sm flex-col gap-3 outline-none sm:right-6 sm:bottom-6">
        {toasts.map((toast) => {
          const tone = toast.type === 'success' || toast.type === 'error' ? toast.type : 'info'
          const { Icon, className } = appearances[tone]
          return (
            <BaseToast.Root key={toast.id} toast={toast} className="pointer-events-auto relative shrink-0 rounded-card border border-solid border-line bg-panel p-4 font-sans text-body shadow-surface transition-[opacity,transform] duration-200 data-starting:translate-y-3 data-starting:opacity-0 motion-reduce:transition-none data-limited:hidden data-ending:opacity-0">
              <BaseToast.Content className="flex items-start gap-3 pr-9">
                <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-current/10 ${className}`}><Icon size={18} aria-hidden="true" /></span>
                <div className="min-w-0"><BaseToast.Title className="m-0 font-heading text-sm font-semibold text-ink" /><BaseToast.Description className="mt-1 mb-0 text-sm leading-relaxed" /></div>
              </BaseToast.Content>
              <BaseToast.Close aria-label={closeLabel} aria-hidden={false} className="absolute top-2 right-2 inline-flex size-11 cursor-pointer items-center justify-center rounded-control border-0 bg-transparent text-body hover:bg-subtle focus-visible:outline-2 focus-visible:outline-brand"><X size={17} aria-hidden="true" /></BaseToast.Close>
            </BaseToast.Root>
          )
        })}
      </BaseToast.Viewport>
    </BaseToast.Portal>
  )
}

export function ToastProvider({ children, label, closeLabel }: Readonly<{ children: ReactNode; label: string; closeLabel: string }>) {
  return <BaseToast.Provider timeout={6000} limit={3}>{children}<ToastList label={label} closeLabel={closeLabel} /></BaseToast.Provider>
}
