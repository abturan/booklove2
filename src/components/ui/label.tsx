'use client'

import * as React from 'react'
import { cn } from '@/lib/cn'

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn('block text-sm text-gray-600 mb-1', className)}
      {...props}
    />
  )
}

export default Label
