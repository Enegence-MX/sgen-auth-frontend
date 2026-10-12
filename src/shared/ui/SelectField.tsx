import { useId, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { fieldControlClassName, fieldLabelClassName } from './field-styles'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
  error?: string
}

export function SelectField({ label, id, hint, error, children, className = '', 'aria-describedby': describedBy, ...props }: Readonly<SelectFieldProps>) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const descriptionId = `${inputId}-description`
  const description = error || hint
  const listbox = props.multiple || (props.size ?? 0) > 1
  return (
    <>
      <label htmlFor={inputId} className={fieldLabelClassName}>{label}</label>
      <div className="relative">
        <select {...props} id={inputId} aria-invalid={error ? true : props['aria-invalid']} aria-describedby={[describedBy, description ? descriptionId : undefined].filter(Boolean).join(' ') || undefined} className={`${fieldControlClassName} ${listbox ? '' : 'appearance-none pr-11'} ${className}`}>
          {children}
        </select>
        {!listbox && <ChevronDown size={18} aria-hidden="true" className="pointer-events-none absolute top-4 right-3.5 text-muted" />}
      </div>
      {description && <p id={descriptionId} className={`mt-0 mb-4 text-sm ${error ? 'text-negative' : 'text-body'}`}>{description}</p>}
    </>
  )
}
