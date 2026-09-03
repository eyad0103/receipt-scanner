import { forwardRef, HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode
}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  function CardDescription({ className, children, ...props }, ref) {
    return (
      <p className={cn("text-sm text-text-secondary", className)} ref={ref} {...props}>
        {children}
      </p>
    )
  },
)

CardDescription.displayName = "CardDescription"
