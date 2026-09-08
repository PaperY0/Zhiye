import type { HTMLAttributes, ReactNode } from "react"
import clsx from "clsx"

export interface FilterBarProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function FilterBar({
  children,
  className,
  role = "group",
  ...props
}: FilterBarProps) {
  return (
    <div
      className={clsx("prototype-filter-bar", className)}
      role={role}
      {...props}
    >
      {children}
    </div>
  )
}

export default FilterBar
