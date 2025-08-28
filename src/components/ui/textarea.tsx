'use client'

import * as React from 'react'
import { cn } from '@/lib/cn'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-xl border px-4 py-3 outline-none',
          'focus:ring-2 focus:ring-rose-500 focus:border-rose-500',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export default Textarea
