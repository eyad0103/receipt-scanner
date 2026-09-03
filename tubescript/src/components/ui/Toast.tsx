import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToastProps {
  id: string
  title?: string
  message: string
  type?: "info" | "success" | "warning" | "error"
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastState extends ToastProps {
  visible: boolean
}

const TOAST_DURATION = 5000

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([])

  const addToast = (toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).slice(2, 11)
    setToasts((prev) => [
      ...prev,
      { ...toast, id, visible: true },
    ])
  }

  const removeToast = (id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t)),
    )
  }

  useEffect(() => {
    const timers = toasts.map((toast) => {
      if (toast.duration !== Infinity) {
        return setTimeout(() => removeToast(toast.id), toast.duration ?? TOAST_DURATION)
      }
    })

    return () => timers.forEach((t) => clearTimeout(t))
  }, [toasts])

  const dismiss = (id: string) => {
    removeToast(id)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 150)
  }

  return {
    toasts,
    addToast,
    removeToast: dismiss,
    ToastContainer,
  } as const
}

export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastState[]
  onRemove: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: ToastState
  onRemove: (id: string) => void
}) {
  const typeIcons = {
    info: "i",
    success: "✓",
    warning: "!",
    error: "✕",
  }

  const typeClasses = {
    info: "border-border",
    success: "border-border",
    warning: "border-border",
    error: "border-[#ff453a]/20",
  }

  return (
    <div
      className={cn(
        "min-w-[320px] max-w-md bg-card border rounded-lg p-4 shadow-xl",
        "transition-all duration-150",
        toast.visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
        typeClasses[toast.type ?? "info"],
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium mt-0.5",
            "bg-surface text-text-tertiary",
            toast.type === "error" && "bg-[#ff453a]/10 text-[#ff453a]",
          )}
        >
          {typeIcons[toast.type ?? "info"]}
        </div>
        <div className="flex-1">
          {toast.title && (
            <p className="text-sm font-medium text-text mb-0.5">{toast.title}</p>
          )}
          <p className="text-sm text-text-secondary">{toast.message}</p>
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center hover:bg-border text-text-tertiary hover:text-text transition-all"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      {toast.action && (
        <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border">
          <button
            onClick={() => onRemove(toast.id)}
            className="text-xs text-text-tertiary hover:text-text px-2 py-1 rounded hover:bg-border transition-all"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              toast.action?.onClick()
              onRemove(toast.id)
            }}
            className="text-xs font-medium text-text px-2 py-1 rounded hover:bg-border transition-all"
          >
            {toast.action.label}
          </button>
        </div>
      )}
    </div>
  )
}

ToastContainer.displayName = "ToastContainer"
