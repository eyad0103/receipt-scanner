import { forwardRef, HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  bordered?: boolean
  padding?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card({ className, children, bordered = true, padding = true, ...props }, ref) {
    return (
      <div
        className={cn(
          "bg-card rounded-xl transition-all duration-150",
          bordered && "border border-border",
          bordered && "hover:border-border-hover",
          padding && "p-6",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  },
)

Card.displayName = "Card"
