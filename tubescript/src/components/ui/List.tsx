import { forwardRef, HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface ListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: "default" | "compact"
}

export const List = forwardRef<HTMLDivElement, ListProps>(
  function List({ className, children, variant = "default", ...props }, ref) {
    const variantClasses = {
      default: "py-1.5",
      compact: "py-1",
    }

    return (
      <div
        className={cn(
          "flex flex-col rounded-lg overflow-hidden bg-card border border-border",
          variantClasses[variant],
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

List.displayName = "List"

export interface ListItemProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  icon?: ReactNode
  active?: boolean
  onClick?: () => void
}

export const ListItem = forwardRef<HTMLDivElement, ListItemProps>(
  function ListItem({ className, children, icon, active, onClick, ...props }, ref) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md mx-1 transition-all duration-150",
          "hover:bg-border text-text-secondary hover:text-text",
          active && "bg-surface text-text",
          onClick && "cursor-pointer",
          className,
        )}
        ref={ref}
        onClick={onClick}
        {...props}
      >
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <div className="flex-1">{children}</div>
      </div>
    )
  },
)

ListItem.displayName = "ListItem"
