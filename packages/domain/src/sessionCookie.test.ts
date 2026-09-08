import { describe, expect, it } from "vitest"
import {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  createSessionCookie,
  readSessionCookie,
} from "./sessionCookie"

describe("session cookie policy", () => {
  it("creates an HttpOnly host cookie and clears it on logout", () => {
    const cookie = createSessionCookie("opaque-session-token", {
      secure: true,
      maxAgeSeconds: 3600,
    })

    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=opaque-session-token`)
    expect(cookie).toContain("HttpOnly")
    expect(cookie).toContain("SameSite=Lax")
    expect(cookie).toContain("Path=/")
    expect(cookie).toContain("Secure")
    expect(readSessionCookie(cookie)).toBe("opaque-session-token")

    expect(clearSessionCookie()).toContain(`${SESSION_COOKIE_NAME}=`)
    expect(clearSessionCookie()).toContain("Max-Age=0")
  })
})
