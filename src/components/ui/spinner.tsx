import * as React from "react"
import { cn } from "../../lib/utils"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
  color?: "primary" | "white" | "yellow"
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "md", color = "primary", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4 border-2",
      md: "h-6 w-6 border-2",
      lg: "h-8 w-8 border-3",
    }
    
    const colorClasses = {
      primary: "border-t-primary",
      white: "border-t-white",
      yellow: "border-t-yellow-400",
    }

    return (
      <div
        className={cn(
          "animate-spin rounded-full border-solid border-t-transparent",
          sizeClasses[size],
          colorClasses[color],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Spinner.displayName = "Spinner"

export { Spinner } 