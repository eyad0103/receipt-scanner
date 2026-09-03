import { forwardRef, HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {}

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  function Separator({ className, ...props }, ref) {
    return (
      <div
        className={cn("h-px w-full bg-border my-4", className)}
        ref={ref}
        {...props}
      />
    )
  },
)

Separator.displayName = "Separator"
