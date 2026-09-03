import {
  forwardRef,
  ButtonHTMLAttributes,
  ReactNode,
} from "react"
import { cn } from "@/lib/utils"

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
type ButtonSize = "sm" | "md" | "lg" | "icon"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  children: ReactNode
}

const buttonVariants = {
  base: "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  primary:
    "bg-white text-black hover:bg-[#e5e5e5] active:scale-[0.98]",
  secondary:
    "bg-surface hover:bg-border text-text border border-border",
  ghost:
    "hover:bg-border text-text-secondary hover:text-text",
  danger:
    "hover:bg-[#1a1a1a] text-[#ff453a]",
}

const buttonSizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
  icon: "h-9 w-9 p-0",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant = "primary", size = "md", fullWidth, children, ...props }, ref) {
    const variantClass = buttonVariants[variant]
    const sizeClass = buttonSizes[size]

    return (
      <button
        className={cn(buttonVariants.base, variantClass, sizeClass, fullWidth && "w-full", className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  },
)

Button.displayName = "Button"
