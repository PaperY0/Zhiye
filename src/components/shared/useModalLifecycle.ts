import { type RefObject, useEffect, useRef } from "react"

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",")

let bodyLockCount = 0
let previousBodyOverflow = ""
const overlayStack: symbol[] = []

function lockBody() {
  if (bodyLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
  }
  bodyLockCount += 1
}

function unlockBody() {
  bodyLockCount = Math.max(0, bodyLockCount - 1)
  if (bodyLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow
  }
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true",
  )
}

export function useModalLifecycle(options: {
  open: boolean
  onClose: () => void
  containerRef: RefObject<HTMLElement | null>
  initialFocusRef: RefObject<HTMLElement | null>
}) {
  const { open, onClose, containerRef, initialFocusRef } = options
  const closeRef = useRef(onClose)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const overlayIdRef = useRef(Symbol("prototype-overlay"))

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    const overlayId = overlayIdRef.current
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    overlayStack.push(overlayId)
    lockBody()
    initialFocusRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (overlayStack.at(-1) !== overlayId) return
      if (event.key === "Escape") {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== "Tab") return

      const container = containerRef.current
      if (!container) return
      const focusable = getFocusable(container)
      if (focusable.length === 0) {
        event.preventDefault()
        container.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !container.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      const index = overlayStack.lastIndexOf(overlayId)
      if (index >= 0) overlayStack.splice(index, 1)
      unlockBody()
      returnFocusRef.current?.focus()
    }
  }, [open, containerRef, initialFocusRef])
}
