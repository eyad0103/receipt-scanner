import { forwardRef, InputHTMLAttributes } from "react"
import { Search as SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SearchProps extends InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string
}

export const Search = forwardRef<HTMLInputElement, SearchProps>(
  function Search({ className, placeholder = "Search transcripts...", ...props }, ref) {
    return (
      <div className="relative w-full">
        <input
          type="search"
          placeholder={placeholder}
          className={cn(
            "w-full h-10 pl-10 pr-3 rounded-lg bg-surface border border-border text-sm text-text",
            "placeholder:text-text-tertiary focus:border-text-tertiary transition-colors",
            "appearance-none",
            className,
          )}
          ref={ref}
          {...props}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
          <SearchIcon className="w-4 h-4" />
        </div>
      </div>
    )
  },
)

Search.displayName = "Search"
