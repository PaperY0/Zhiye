import { type ReactNode, useId, useRef } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { useModalLifecycle } from "./useModalLifecycle"

export interface DialogProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function Dialog({
  open,
  title,
  description,
  onClose,
  children,
  footer,
}: DialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)

  useModalLifecycle({
    open,
    onClose,
    containerRef: dialogRef,
    initialFocusRef: closeButtonRef,
  })

  if (!open) return null

  return createPortal(
    <div
      className="prototype-overlay prototype-dialog-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="prototype-dialog prototype-glass prototype-glass--sheet"
        role="dialog"
      >
        <header className="prototype-overlay-header">
          <div className="prototype-overlay-heading">
            <h2 id={titleId}>{title}</h2>
            {description ? <p id={descriptionId}>{description}</p> : null}
          </div>
          <button
            ref={closeButtonRef}
            aria-label={`关闭${title}`}
            className="prototype-icon-button"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} strokeWidth={2} />
          </button>
        </header>
        <div className="prototype-dialog-body">{children}</div>
        {footer ? (
          <footer className="prototype-dialog-footer">{footer}</footer>
        ) : null}
      </section>
    </div>,
    document.body,
  )
}

export default Dialog
