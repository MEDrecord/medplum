import { z } from 'zod'

/**
 * Environment configuration schema
 * All values MUST come from environment variables - no hardcoding
 */
const envSchema = z.object({
  HEALTHTALK_GATEWAY_URL: z.string().url(),
  HEALTHTALK_TENANT_ID: z.string().uuid(),
  HEALTHTALK_CLIENT_ID: z.string().uuid(),
  // Optional: Only for server-to-server communication
  HEALTHTALK_API_KEY: z.string().optional(),
})

export type EnvConfig = z.infer<typeof envSchema>

/**
 * Validates and returns environment configuration
 * Throws if required variables are missing
 */
export function getConfig(): EnvConfig {
  const config = envSchema.safeParse({
    HEALTHTALK_GATEWAY_URL: process.env.HEALTHTALK_GATEWAY_URL,
    HEALTHTALK_TENANT_ID: process.env.HEALTHTALK_TENANT_ID,
    HEALTHTALK_CLIENT_ID: process.env.HEALTHTALK_CLIENT_ID,
    HEALTHTALK_API_KEY: process.env.HEALTHTALK_API_KEY,
  })

  if (!config.success) {
    const missing = config.error.issues.map(i => i.path.join('.')).join(', ')
    throw new Error(`Missing or invalid environment variables: ${missing}`)
  }

  return config.data
}

/**
 * Safe config getter that returns null instead of throwing
 * Useful for checking if config is available
 */
export function getConfigSafe(): EnvConfig | null {
  try {
    return getConfig()
  } catch {
    return null
  }
}
