import { useEffect, useSyncExternalStore } from "react"
import { formatRoute, parseHash, type AppRoute } from "./routes"

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("hashchange", onStoreChange)
  return () => window.removeEventListener("hashchange", onStoreChange)
}

function getHashSnapshot(): string {
  return window.location.hash
}

function getServerHashSnapshot(): string {
  return formatRoute({ page: "welcome" })
}

export function useHashRoute(): AppRoute {
  const hash = useSyncExternalStore(
    subscribe,
    getHashSnapshot,
    getServerHashSnapshot,
  )

  useEffect(() => {
    if (window.location.hash === "") {
      window.history.replaceState(null, "", formatRoute({ page: "welcome" }))
    }
  }, [])

  return parseHash(hash)
}
