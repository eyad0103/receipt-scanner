import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', className = '', ...props }, ref) => {
    const baseStyles = 'bg-white rounded-lg shadow-sm'

    const variantStyles = {
      default: '',
      hover: 'hover:shadow-md transition-shadow',
    }

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card
