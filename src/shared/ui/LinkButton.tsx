import { Link, type LinkProps } from 'react-router'
import { buttonClassName, type ButtonVariant, type ButtonSize } from './button-styles'

export function LinkButton({ variant = 'primary', size = 'md', className = '', ...props }: Readonly<LinkProps & { variant?: ButtonVariant; size?: ButtonSize }>) {
  return <Link {...props} className={`${buttonClassName(variant, size)} no-underline ${className}`} />
}
