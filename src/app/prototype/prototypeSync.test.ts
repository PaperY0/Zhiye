import { afterEach, describe, expect, it, vi } from "vitest"
import { listenForPrototypeSync, publishPrototypeSync } from "./prototypeSync"

class FakeBroadcastChannel {
  static instances: FakeBroadcastChannel[] = []
  onmessage: ((event: MessageEvent) => void) | null = null
  constructor(public name: string) {
    FakeBroadcastChannel.instances.push(this)
  }
  postMessage = vi.fn((data: unknown) => {
    for (const channel of FakeBroadcastChannel.instances) {
      if (channel !== this && channel.name === this.name) {
        channel.onmessage?.({ data } as MessageEvent)
      }
    }
  })
  close = vi.fn()
}

describe("prototype cross-role synchronization", () => {
  afterEach(() => {
    FakeBroadcastChannel.instances = []
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it("publishes to another tab and receives storage updates", () => {
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel)
    const received = vi.fn()
    const secondReceived = vi.fn()
    const cleanup = listenForPrototypeSync("shared-key", received)
    const secondCleanup = listenForPrototypeSync("shared-key", secondReceived)
    const snapshot = { lessons: [{ id: "lesson-1" }] }

    publishPrototypeSync("shared-key", snapshot)
    expect(received).toHaveBeenCalledWith(snapshot)
    expect(secondReceived).toHaveBeenCalledWith(snapshot)

    window.dispatchEvent(new StorageEvent("storage", {
      key: "shared-key",
      newValue: JSON.stringify({ lessons: [{ id: "lesson-2" }] }),
    }))
    expect(received).toHaveBeenLastCalledWith({ lessons: [{ id: "lesson-2" }] })

    cleanup()
    secondCleanup()
    expect(FakeBroadcastChannel.instances.some((channel) => channel.close.mock.calls.length > 0)).toBe(true)
  })
})
