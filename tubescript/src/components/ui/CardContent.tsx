import { forwardRef, HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  function CardContent({ className, children, ...props }, ref) {
    return (
      <div className={cn("pt-0", className)} ref={ref} {...props}>
        {children}
      </div>
    )
  },
)

CardContent.displayName = "CardContent"
