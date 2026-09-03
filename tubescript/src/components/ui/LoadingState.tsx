import { forwardRef, HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  function LoadingSpinner({ className, size = "md", ...props }, ref) {
    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-8 h-8",
      lg: "w-12 h-12",
    }

    return (
      <div
        className={cn("inline-block animate-spin rounded-full border-2 border-border border-t-transparent", sizeClasses[size], className)}
        ref={ref}
        {...props}
      />
    )
  },
)

LoadingSpinner.displayName = "LoadingSpinner"

export interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
}

export const LoadingState = forwardRef<HTMLDivElement, LoadingStateProps>(
  function LoadingState({ className, title = "Loading...", description, ...props }, ref) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center text-center py-12 px-6",
          className,
        )}
        ref={ref}
        {...props}
      >
        <LoadingSpinner size="lg" />
        <h3 className="text-lg font-medium text-text mt-4 mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-text-tertiary max-w-sm">{description}</p>
        )}
      </div>
    )
  },
)

LoadingState.displayName = "LoadingState"
