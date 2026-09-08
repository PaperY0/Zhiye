import { render, screen } from "@testing-library/react"
import LivingLandscapeBackdrop from "./LivingLandscapeBackdrop"

describe("LivingLandscapeBackdrop", () => {
  it("renders the local mountain-and-kite scene with atmospheric motion layers", () => {
    render(<LivingLandscapeBackdrop />)

    expect(screen.getByTestId("living-landscape")).toBeInTheDocument()
    expect(screen.getByTestId("living-landscape-scene")).toHaveAttribute(
      "src",
      expect.stringContaining("zhiye-kite-valley.png"),
    )
    expect(screen.getByTestId("living-landscape-clouds")).toBeInTheDocument()
    expect(screen.getByTestId("living-landscape-kites")).toBeInTheDocument()
    expect(document.querySelector(".living-landscape-meadow")).not.toBeInTheDocument()
  })
})
