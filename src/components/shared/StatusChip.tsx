import type { HTMLAttributes, ReactNode } from "react"
import clsx from "clsx"

export type StatusTone = "neutral" | "success" | "info" | "warning" | "critical"

export interface StatusChipProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  tone?: StatusTone
}

export function StatusChip({
  children,
  tone = "neutral",
  className,
  ...props
}: StatusChipProps) {
  return (
    <span
      className={clsx(
        "prototype-status-chip",
        `prototype-status-chip--${tone}`,
        className,
      )}
      data-tone={tone}
      {...props}
    >
      {children}
    </span>
  )
}

export default StatusChip
