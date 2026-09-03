import { forwardRef, InputHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, label, error, icon, ...props }, ref) {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs text-text-tertiary mb-1.5">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {icon}
            </div>
          )}
          <input
            className={cn(
              "w-full h-10 px-3 rounded-lg bg-surface border border-border text-sm text-text",
              "placeholder:text-text-tertiary focus:border-text-tertiary transition-colors",
              error && "border-[#ff453a] focus:border-[#ff453a]",
              icon && "pl-10",
              className,
            )}
            ref={ref}
            {...props}
          />
          {error && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#ff453a]">
              {error}
            </span>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-[#ff453a]">{error}</p>}
      </div>
    )
  },
)

Input.displayName = "Input"
