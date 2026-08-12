import { describe, expect, it } from "vitest"
import { validateDemoCredentials } from "./demoCredentials"

describe("local demo credentials", () => {
  const config = { enabled: true, email: "teacher@example.test", accessCode: "local-only" }

  it("accepts matching credentials outside production", () => {
    expect(validateDemoCredentials(config, config, "development")).toBe(true)
  })

  it("rejects wrong credentials and every production attempt", () => {
    expect(validateDemoCredentials({ email: "other@example.test", accessCode: "local-only" }, config, "development")).toBe(false)
    expect(validateDemoCredentials(config, config, "production")).toBe(false)
    expect(validateDemoCredentials(config, { ...config, enabled: false }, "development")).toBe(false)
  })
})
