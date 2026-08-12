import { auth } from "../../../auth"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ code: "UNAUTHENTICATED" }, { status: 401 })
  }
  return Response.json({ code: "OK" })
}
