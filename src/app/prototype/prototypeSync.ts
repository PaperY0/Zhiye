export type PrototypeSyncSnapshot = Record<string, unknown>

type SyncPayload = {
  storageKey: string
  snapshot: PrototypeSyncSnapshot
}

const channelName = "zhiye-prototype-sync-v1"

export function publishPrototypeSync(
  storageKey: string,
  snapshot: PrototypeSyncSnapshot,
) {
  if (typeof window === "undefined") return
  try {
    const channel = new BroadcastChannel(channelName)
    channel.postMessage({ storageKey, snapshot } satisfies SyncPayload)
    channel.close()
  } catch {
    // The storage event remains the compatibility path.
  }
}

export function listenForPrototypeSync(
  storageKey: string,
  onSnapshot: (snapshot: PrototypeSyncSnapshot) => void,
) {
  if (typeof window === "undefined") return () => undefined

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== storageKey || !event.newValue) return
    try {
      onSnapshot(JSON.parse(event.newValue) as PrototypeSyncSnapshot)
    } catch {
      // Ignore malformed external state.
    }
  }
  window.addEventListener("storage", handleStorage)

  let channel: BroadcastChannel | null = null
  try {
    channel = new BroadcastChannel(channelName)
    channel.onmessage = (event: MessageEvent<SyncPayload>) => {
      if (event.data?.storageKey === storageKey && event.data.snapshot) {
        onSnapshot(event.data.snapshot)
      }
    }
  } catch {
    channel = null
  }

  return () => {
    window.removeEventListener("storage", handleStorage)
    channel?.close()
  }
}
