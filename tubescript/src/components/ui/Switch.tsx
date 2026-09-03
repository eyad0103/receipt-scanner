import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface SwitchProps {
  checked: boolean
  onChange?: (checked: boolean) => void
  className?: string
  disabled?: boolean
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  function Switch({ className, checked, onChange, disabled }, ref) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange?.(!checked)}
        disabled={disabled}
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          checked
            ? "bg-gray-300"
            : "bg-border",
          className,
        )}
        ref={ref}
      >
        <span
          className={cn(
            "pointer-events-none block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-all duration-200",
            checked
              ? "translate-x-4 opacity-100"
              : "translate-x-0.5 opacity-100",
          )}
        />
      </button>
    )
  },
)

Switch.displayName = "Switch"
