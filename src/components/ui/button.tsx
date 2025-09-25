//src/components/ui/button.tsx
'use client'

import * as React from 'react'
import { cn } from '@/lib/cn'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center rounded-xl px-4 py-3 font-medium transition disabled:opacity-60 disabled:cursor-not-allowed'
    const styles =
      variant === 'primary'
        ? 'bg-rose-600 text-white hover:bg-rose-700'
        : variant === 'secondary'
        ? 'bg-gray-900 text-white hover:bg-black'
        : 'bg-red-600 text-white hover:bg-red-700'
    return (
      <button ref={ref} className={cn(base, styles, className)} {...props} />
    )
  }
)
Button.displayName = 'Button'

export default Button
