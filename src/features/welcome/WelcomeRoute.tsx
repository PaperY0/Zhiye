import { getRoleHome, navigate, type Role } from "../../app/routes"
import WelcomeScreen from "../../components/WelcomeScreen"

export default function WelcomeRoute() {
  const enterRole = (role: Role) => navigate(getRoleHome(role))
  return <WelcomeScreen onEnterRole={enterRole} />
}
