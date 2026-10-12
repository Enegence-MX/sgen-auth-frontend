import type { InputHTMLAttributes } from 'react'
import { Check } from 'lucide-react'

export interface ChoiceProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  hideLabel?: boolean
}

function Choice({ label, hideLabel, className = '', type, ...props }: Readonly<ChoiceProps & { type: 'checkbox' | 'radio' }>) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50">
      <span className="relative inline-flex size-5 shrink-0 items-center justify-center">
        <input {...props} type={type} className={`peer m-0 size-5 shrink-0 cursor-[inherit] appearance-none border border-solid border-line-strong bg-field shadow-control transition-colors checked:border-brand checked:bg-brand enabled:hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand motion-reduce:transition-none forced-colors:appearance-auto ${type === 'radio' ? 'rounded-full' : 'rounded-[5px]'} ${className}`} />
        {type === 'checkbox'
          ? <Check size={14} strokeWidth={3} aria-hidden="true" className="pointer-events-none absolute text-on-brand opacity-0 peer-checked:opacity-100 forced-colors:hidden" />
          : <span aria-hidden="true" className="pointer-events-none absolute size-2 rounded-full bg-on-brand opacity-0 peer-checked:opacity-100 forced-colors:hidden" />}
      </span>
      <span className={hideLabel ? 'sr-only' : undefined}>{label}</span>
    </label>
  )
}

export function Checkbox(props: Readonly<ChoiceProps>) {
  return <Choice {...props} type="checkbox" />
}

export function Radio(props: Readonly<ChoiceProps>) {
  return <Choice {...props} type="radio" />
}
