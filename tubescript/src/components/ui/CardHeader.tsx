import { forwardRef, HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader({ className, children, ...props }, ref) {
    return (
      <div className={cn("flex flex-col space-y-1.5 pb-4", className)} ref={ref} {...props}>
        {children}
      </div>
    )
  },
)

CardHeader.displayName = "CardHeader"
