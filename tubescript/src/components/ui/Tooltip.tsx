import { forwardRef, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  delay?: number
  className?: string
  onClick?: () => void
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  function Tooltip({ className, content, children, delay = 500, onClick }, ref) {
    return (
      <div
        className={cn(
          "relative inline-block cursor-pointer transition-transform duration-150 group",
          className,
        )}
         ref={ref}
         onClick={onClick}
       >
        {children}
        <div
          className={cn(
            "invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2",
            "px-2.5 py-1.5 text-xs text-text-tertiary bg-surface border border-border rounded-md",
            "opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none",
            "whitespace-nowrap z-50",
          )}
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-border"></div>
        </div>
      </div>
    )
  },
)

Tooltip.displayName = "Tooltip"

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <div className="group">{children}</div>
}
