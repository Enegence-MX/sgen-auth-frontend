import { useId, type TextareaHTMLAttributes } from 'react'
import { fieldControlClassName, fieldLabelClassName } from './field-styles'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
  error?: string
}

export function TextArea({ label, id, hint, error, className = '', rows = 4, 'aria-describedby': describedBy, ...props }: Readonly<TextAreaProps>) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const descriptionId = `${inputId}-description`
  const description = error || hint
  return (
    <>
      <label htmlFor={inputId} className={fieldLabelClassName}>{label}</label>
      <textarea {...props} id={inputId} rows={rows} aria-invalid={error ? true : props['aria-invalid']} aria-describedby={[describedBy, description ? descriptionId : undefined].filter(Boolean).join(' ') || undefined} className={`${fieldControlClassName} resize-y ${className}`} />
      {description && <p id={descriptionId} className={`mt-0 mb-4 text-sm ${error ? 'text-negative' : 'text-body'}`}>{description}</p>}
    </>
  )
}
