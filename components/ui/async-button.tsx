"use client"

import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ButtonProps } from "@/components/ui/button"

interface AsyncButtonProps extends Omit<ButtonProps, 'onClick' | 'disabled'> {
  onClick: () => Promise<void> | void
  isLoading: boolean
  loadingText: string
  children: React.ReactNode
  icon?: 'loader' | 'refresh' | React.ReactNode
  disabled?: boolean
}

export function AsyncButton({
  onClick,
  isLoading,
  loadingText,
  children,
  icon = 'loader',
  disabled = false,
  className,
  ...props
}: AsyncButtonProps) {
  const LoadingIcon = icon === 'loader' ? Loader2 : icon === 'refresh' ? RefreshCw : null
  
  return (
    <Button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={cn("flex items-center gap-1", className)}
      {...props}
    >
      {isLoading ? (
        <>
          {typeof icon === 'string' && LoadingIcon ? (
            <LoadingIcon className="h-4 w-4 animate-spin" />
          ) : (
            icon
          )}
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
