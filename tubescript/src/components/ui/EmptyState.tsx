import { forwardRef, HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  function EmptyState({ className, title = "No data", description, icon, action, ...props }, ref) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center text-center py-12 px-6",
          className,
        )}
        ref={ref}
        {...props}
      >
        {icon && (
          <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-5">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-medium text-text mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-text-tertiary mb-5 max-w-sm">{description}</p>
        )}
        {action}
      </div>
    )
  },
)

EmptyState.displayName = "EmptyState"
