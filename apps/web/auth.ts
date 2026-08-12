import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { validateDemoCredentials } from "./demoCredentials"
import { findUserByEmail } from "./db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "local-demo",
      credentials: {
        email: { label: "Email", type: "email" },
        accessCode: { label: "Access code", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
        const accessCode = String(credentials?.accessCode ?? "")
        if (!validateDemoCredentials({ email, accessCode }, {
          enabled: process.env.DEMO_DATA_MODE === "true",
          email: process.env.DEMO_LOGIN_EMAIL,
          accessCode: process.env.DEMO_LOGIN_CODE,
        }, process.env.NODE_ENV === "production" ? "production" : "development")) {
          return null
        }
        const user = await findUserByEmail(email)
        return user ?? null
      },
    }),
  ],
  trustHost: true,
  session: { strategy: "jwt" },
})
