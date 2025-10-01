import React from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'secondary' | 'ghost' | 'destructive'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

export const Button: React.FC<Props> = ({ variant = 'default', className, ...props }) => {
  const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none h-9 px-4 py-2'
  const variants: Record<Variant, string> = {
    default: 'bg-primary text-white hover:bg-blue-600',
    secondary: 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50',
    ghost: 'bg-transparent hover:bg-slate-100',
    destructive: 'bg-error text-white hover:bg-red-600',
  }
  return <button className={cn(base, variants[variant], className)} {...props} />
}

export default Button
