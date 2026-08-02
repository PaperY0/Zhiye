import type { HTMLAttributes, ReactNode } from "react"
import clsx from "clsx"

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div className={clsx("prototype-empty-state", className)} {...props}>
      <div aria-hidden="true" className="prototype-empty-state-mark" />
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? (
        <div className="prototype-empty-state-action">{action}</div>
      ) : null}
    </div>
  )
}

export default EmptyState
