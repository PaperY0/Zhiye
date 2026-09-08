import type { HTMLAttributes } from "react"
import clsx from "clsx"

export type GlassWeight = "light" | "card" | "sheet"

export interface GlassSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  weight?: GlassWeight
}

export function GlassSurface({
  weight = "card",
  className,
  ...props
}: GlassSurfaceProps) {
  return (
    <div
      className={clsx(
        "prototype-glass",
        `prototype-glass--${weight}`,
        className,
      )}
      {...props}
    />
  )
}

export default GlassSurface
