import type { ChoiceProps } from './Checkbox'

export function Switch({ label, hideLabel, className = '', ...props }: Readonly<ChoiceProps>) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50">
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input {...props} type="checkbox" role="switch" className={`peer absolute inset-0 m-0 size-full cursor-[inherit] opacity-0 ${className}`} />
        <span aria-hidden="true" className="pointer-events-none flex size-full items-center rounded-full border border-solid border-line-strong bg-line-strong shadow-inner p-0.5 transition-colors peer-checked:border-brand peer-checked:bg-brand peer-hover:border-brand/60 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-brand peer-checked:[&>span]:translate-x-5 motion-reduce:transition-none forced-colors:border-[ButtonText] forced-colors:peer-checked:bg-[Highlight]">
          <span className="size-4.5 shrink-0 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none forced-colors:bg-[ButtonText]" />
        </span>
      </span>
      <span className={hideLabel ? 'sr-only' : undefined}>{label}</span>
    </label>
  )
}
