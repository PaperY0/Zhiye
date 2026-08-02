import AppRouter from "./app/AppRouter"
import { PrototypeProvider } from "./app/prototype/PrototypeContext"

export default function App() {
  return (
    <PrototypeProvider persist>
      <AppRouter />
    </PrototypeProvider>
  )
}
