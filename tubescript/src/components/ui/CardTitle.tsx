import { forwardRef, HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  function CardTitle({ className, children, ...props }, ref) {
    return (
      <h3 className={cn("text-lg font-semibold text-text leading-none", className)} ref={ref} {...props}>
        {children}
      </h3>
    )
  },
)

CardTitle.displayName = "CardTitle"
