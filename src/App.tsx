import { useState } from "react"
import WelcomeScreen from "./components/WelcomeScreen"
import WorkspaceScreen from "./components/WorkspaceScreen"

type Screen = "welcome" | "workspace"

export default function App() {
  const [screen, setScreen] = useState<Screen>("welcome")

  return screen === "welcome" ? (
    <WelcomeScreen onEnter={() => setScreen("workspace")} />
  ) : (
    <WorkspaceScreen onBackToWelcome={() => setScreen("welcome")} />
  )
}
