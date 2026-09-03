import { ReactNode, useEffect, useRef } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  size?: "sm" | "md" | "lg" | "xl"
}

export function Dialog({ open, onClose, title, description, children, size = "md" }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    if (open) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [open, onClose])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  if (!open) return null

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
    >
      <div
        className={cn(
          "w-full bg-card border border-border rounded-xl",
          "animate-in fade-in-0 zoom-in-95 duration-150",
          sizeClasses[size],
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-border text-text-tertiary hover:text-text transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {description && (
          <p className="text-sm text-text-tertiary px-5 py-3 border-b border-border">
            {description}
          </p>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

interface DialogFooterProps {
  children: ReactNode
  className?: string
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div className={cn("flex items-center justify-end gap-3 p-5 border-t border-border", className)}>
      {children}
    </div>
  )
}

DialogFooter.displayName = "DialogFooter"
