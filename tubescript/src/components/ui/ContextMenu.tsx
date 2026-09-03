import { useState, useRef, useEffect, ReactNode, useRef as useReactRef } from "react"
import { cn } from "@/lib/utils"
import { forwardRef, HTMLAttributes } from "react"

interface ContextMenuProps {
  children: ReactNode
  trigger: ReactNode
  className?: string
}

export const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(
  function ContextMenu({ className, trigger, children, ...props }, ref) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false)
        }
      }
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsOpen(false)
      }

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside)
        document.addEventListener("keydown", handleEscape)
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        document.removeEventListener("keydown", handleEscape)
      }
    }, [isOpen])

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault()
      setIsOpen(true)
    }

    return (
      <div
        ref={containerRef}
        className={cn("relative inline-block", className)}
        onContextMenu={handleContextMenu}
        {...props}
      >
        {trigger}
        {isOpen && (
          <div
            className={cn(
              "absolute z-50 mt-1 min-w-[160px] py-1 bg-card border border-border rounded-lg shadow-xl",
              "animate-in fade-in duration-150",
              "origin-top-right right-0",
            )}
          >
            {children}
          </div>
        )}
      </div>
    )
  },
)

ContextMenu.displayName = "ContextMenu"

interface ContextMenuItemProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  icon?: ReactNode
  destructive?: boolean
  onClick?: () => void
}

export const ContextMenuItem = forwardRef<HTMLDivElement, ContextMenuItemProps>(
  function ContextMenuItem({ className, children, icon, destructive, onClick, ...props }, ref) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer rounded-md mx-1 my-0.5",
          "hover:bg-border text-text-secondary hover:text-text",
          destructive && "text-[#ff453a] hover:text-[#ff453a]",
          className,
        )}
        ref={ref}
        onClick={onClick}
        {...props}
      >
        {icon && <div className="w-4 h-4 flex-shrink-0">{icon}</div>}
        {children}
      </div>
    )
  },
)

ContextMenuItem.displayName = "ContextMenuItem"

export const ContextMenuSeparator = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function ContextMenuSeparator({ className, ...props }, ref) {
    return <div className={cn("h-px bg-border my-1 mx-1", className)} ref={ref} {...props} />
  },
)

ContextMenuSeparator.displayName = "ContextMenuSeparator"
