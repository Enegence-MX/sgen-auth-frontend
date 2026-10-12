import type { ButtonHTMLAttributes } from 'react'
import { LoaderCircle } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'icon'
  loading?: boolean
}

const variants = {
  primary: 'border-brand bg-brand text-on-brand shadow-control enabled:hover:border-brand-hover enabled:hover:bg-brand-hover disabled:border-transparent disabled:bg-inactive disabled:text-muted disabled:shadow-none [&[aria-busy=true]]:border-brand [&[aria-busy=true]]:bg-brand [&[aria-busy=true]]:text-on-brand [&[aria-busy=true]]:opacity-75',
  secondary: 'border-line-strong bg-panel text-ink shadow-control enabled:hover:border-brand/50 enabled:hover:bg-brand-soft enabled:hover:text-brand disabled:opacity-50 disabled:shadow-none',
  ghost: 'border-transparent bg-transparent text-brand enabled:hover:bg-brand-soft disabled:opacity-50',
}

const sizes = { sm: 'min-h-9 px-3 py-2 text-sm', md: 'min-h-11 px-4 py-2.5 text-sm', icon: 'size-11 shrink-0 p-0 text-sm' }

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
      className={`inline-flex items-center justify-center gap-2 rounded-control border border-solid font-sans font-semibold leading-normal [&_svg]:shrink-0 cursor-pointer transition-[background-color,border-color,color,box-shadow,transform] duration-150 enabled:active:translate-y-px disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand motion-reduce:transition-none ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && <LoaderCircle size={18} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
      {children}
    </button>
  )
}
