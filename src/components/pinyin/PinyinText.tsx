import { cn, getPinyin } from "./pinyin"

export interface PinyinTextProps {
  text: string
  pinyin?: string
  showPinyin?: boolean
  className?: string
  pinyinClassName?: string
}

export function PinyinText({
  text,
  pinyin,
  showPinyin = true,
  className,
  pinyinClassName,
}: PinyinTextProps) {
  const resolvedPinyin = pinyin ?? getPinyin(text)

  return (
    <span className={cn("inline-flex min-w-0 flex-col pinyin-text", className)}>
      <span>{text}</span>
      {showPinyin && resolvedPinyin ? (
        <span
          data-testid="pinyin-line"
          lang="zh-Latn"
          aria-hidden="true"
          className={cn(
            "text-[0.78em] font-semibold leading-[1.35] tracking-normal text-[#546f5c] pinyin-text-line",
            pinyinClassName,
          )}
        >
          {resolvedPinyin}
        </span>
      ) : null}
    </span>
  )
}
