import { useId, type InputHTMLAttributes } from 'react'
import { fieldControlClassName, fieldLabelClassName } from './field-styles'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

export function TextField({ label, id, className = '', hint, error, 'aria-describedby': describedBy, ...props }: Readonly<TextFieldProps>) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const descriptionId = `${inputId}-description`
  const description = error || hint
  return (
    <>
      <label className={fieldLabelClassName} htmlFor={inputId}>
        {label}
      </label>
      <input
        {...props}
        id={inputId}
        aria-invalid={error ? true : props['aria-invalid']}
        aria-describedby={[describedBy, description ? descriptionId : undefined].filter(Boolean).join(' ') || undefined}
        className={`${fieldControlClassName} ${className}`}
      />
      {description && <p id={descriptionId} className={`mt-0 mb-4 text-sm ${error ? 'text-negative' : 'text-body'}`}>{description}</p>}
    </>
  )
}
