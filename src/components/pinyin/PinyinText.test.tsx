import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PinyinText } from "./PinyinText"

describe("PinyinText", () => {
  it("renders known text with its explicit pinyin line", () => {
    render(<PinyinText text="首页" showPinyin />)

    expect(screen.getByText("首页")).toBeInTheDocument()
    expect(screen.getByText("shǒu yè")).toHaveAttribute("lang", "zh-Latn")
  })

  it("omits the pinyin line for unknown text", () => {
    render(<PinyinText text="未收录动态题目" showPinyin />)

    expect(screen.getByText("未收录动态题目")).toBeInTheDocument()
    expect(screen.queryByTestId("pinyin-line")).not.toBeInTheDocument()
  })

  it("does not render pinyin when explicitly disabled", () => {
    render(<PinyinText text="首页" showPinyin={false} />)

    expect(screen.getByText("首页")).toBeInTheDocument()
    expect(screen.queryByTestId("pinyin-line")).not.toBeInTheDocument()
  })
})
