import { type ReactNode, useId, useRef } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { useModalLifecycle } from "./useModalLifecycle"

export interface DrawerProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function Drawer({ open, title, onClose, children }: DrawerProps) {
  const titleId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLElement>(null)

  useModalLifecycle({
    open,
    onClose,
    containerRef: drawerRef,
    initialFocusRef: closeButtonRef,
  })

  if (!open) return null

  return createPortal(
    <div
      className="prototype-overlay prototype-drawer-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <aside
        ref={drawerRef}
        tabIndex={-1}
        aria-labelledby={titleId}
        aria-modal="true"
        className="prototype-drawer prototype-glass prototype-glass--sheet"
        data-overlay="drawer"
        role="dialog"
      >
        <header className="prototype-overlay-header">
          <div className="prototype-overlay-heading">
            <h2 id={titleId}>{title}</h2>
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
        <div className="prototype-drawer-body">{children}</div>
      </aside>
    </div>,
    document.body,
  )
}

export default Drawer
