import { forwardRef, HTMLAttributes, ReactNode, ThHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  function Table({ className, children, ...props }, ref) {
    return (
      <div className="w-full overflow-x-auto">
        <table
          className={cn("w-full border-collapse text-sm", className)}
          ref={ref}
          {...props}
        >
          {children}
        </table>
      </div>
    )
  },
)

Table.displayName = "Table"

interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode
}

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  function TableHeader({ children, ...props }, ref) {
    return (
      <thead ref={ref} {...props}>
        {children}
      </thead>
    )
  },
)

TableHeader.displayName = "TableHeader"

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode
}

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  function TableHead({ className, children, ...props }, ref) {
    return (
      <th
        className={cn(
          "text-left text-xs font-medium text-text-tertiary uppercase tracking-wider pb-3 px-4",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </th>
    )
  },
)

TableHead.displayName = "TableHead"

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode
}

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  function TableBody({ className, children, ...props }, ref) {
    return (
      <tbody
        className={cn("divide-y divide-border", className)}
        ref={ref}
        {...props}
      >
        {children}
      </tbody>
    )
  },
)

TableBody.displayName = "TableBody"

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode
  clickable?: boolean
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  function TableRow({ className, children, clickable, ...props }, ref) {
    return (
      <tr
        className={cn(
          "border-b border-border transition-colors",
          "hover:bg-border",
          clickable && "cursor-pointer",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </tr>
    )
  },
)

TableRow.displayName = "TableRow"

interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  function TableCell({ className, children, ...props }, ref) {
    return (
      <td
        className={cn("py-3 px-4 align-middle", className)}
        ref={ref}
        {...props}
      >
        {children}
      </td>
    )
  },
)

TableCell.displayName = "TableCell"
