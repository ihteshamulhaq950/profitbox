'use client'

import { toast as sonnerToast } from 'sonner'

// Re-export Sonner's toast function with a compatible API
export const toast = ({
  title,
  description,
  variant,
  ...props
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: 'default' | 'destructive'
  action?: React.ReactNode
}) => {
  if (variant === 'destructive') {
    return sonnerToast.error(title, {
      description,
      ...props,
    })
  }

  return sonnerToast(title, {
    description,
    ...props,
  })
}

// Hook for compatibility (Sonner doesn't need a hook)
export function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
  }
}