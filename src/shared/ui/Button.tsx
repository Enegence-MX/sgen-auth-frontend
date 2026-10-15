import type { ButtonHTMLAttributes } from 'react'
import { LoaderCircle } from 'lucide-react'
import { buttonClassName } from './button-styles'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'icon'
  loading?: boolean
}

export function Button({
  children,
  className = '',
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  ...props
}: Readonly<ButtonProps>) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${buttonClassName(variant, size)} ${className}`}
    >
      {loading && <LoaderCircle size={18} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
      {children}
    </button>
  )
}
