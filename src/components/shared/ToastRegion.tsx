import { X } from "lucide-react"
import clsx from "clsx"
import type { StatusTone } from "./StatusChip"

export interface ToastMessage {
  id: string
  title: string
  description?: string
  tone?: StatusTone
}

export interface ToastRegionProps {
  toasts: readonly ToastMessage[]
  onDismiss?: (id: string) => void
  label?: string
}

export function ToastRegion({
  toasts,
  onDismiss,
  label = "操作通知",
}: ToastRegionProps) {
  return (
    <section
      aria-label={label}
      aria-live="polite"
      aria-relevant="additions text"
      className="prototype-toast-region"
      role="region"
    >
      {toasts.map((toast) => {
        const tone = toast.tone ?? "neutral"

        return (
          <article
            className={clsx(
              "prototype-toast",
              "prototype-glass",
              "prototype-glass--card",
              `prototype-toast--${tone}`,
            )}
            key={toast.id}
            role={tone === "critical" ? "alert" : "status"}
          >
            <div className="prototype-toast-copy">
              <strong>{toast.title}</strong>
              {toast.description ? <p>{toast.description}</p> : null}
            </div>
            {onDismiss ? (
              <button
                aria-label={`关闭通知：${toast.title}`}
                className="prototype-icon-button prototype-toast-close"
                onClick={() => onDismiss(toast.id)}
                type="button"
              >
                <X aria-hidden="true" size={16} strokeWidth={2} />
              </button>
            ) : null}
          </article>
        )
      })}
    </section>
  )
}

export default ToastRegion
