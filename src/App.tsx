import AppRouter from "./app/AppRouter"
import { PrototypeProvider } from "./app/prototype/PrototypeContext"

export default function App() {
  const emptyData =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("data") === "empty"

  return (
    <PrototypeProvider persist dataset={emptyData ? "empty" : "acceptance"}>
      <AppRouter />
    </PrototypeProvider>
  )
}
