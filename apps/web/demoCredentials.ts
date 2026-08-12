export type DemoCredentialConfig = {
  enabled?: boolean
  email?: string
  accessCode?: string
}

export function validateDemoCredentials(
  input: { email?: unknown; accessCode?: unknown },
  config: DemoCredentialConfig,
  environment: "development" | "test" | "production",
): boolean {
  if (environment === "production" || !config.enabled) return false
  return (
    String(input.email ?? "") === config.email &&
    String(input.accessCode ?? "") === config.accessCode &&
    Boolean(config.email && config.accessCode)
  )
}
