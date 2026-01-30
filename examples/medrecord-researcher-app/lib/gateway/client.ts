import 'server-only'
import { getConfig } from '@/lib/config'
import { cookies } from 'next/headers'

export class GatewayError extends Error {
  constructor(
    public status: number,
    public body: string
  ) {
    super(`Gateway error ${status}: ${body}`)
    this.name = 'GatewayError'
  }
}

interface GatewayFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

/**
 * Server-only gateway client
 * All requests are proxied through the HealthTalk Gateway
 * Authentication is handled via session cookies
 */
export async function gatewayFetch<T>(
  path: string,
  options: GatewayFetchOptions = {}
): Promise<T> {
  const config = getConfig()
  const cookieStore = await cookies()

  const url = `${config.HEALTHTALK_GATEWAY_URL}${path}`

  const response = await fetch(url, {
    ...options,
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': config.HEALTHTALK_TENANT_ID,
      // Forward session cookie for authentication
      Cookie: cookieStore.toString(),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  })

  if (!response.ok) {
    throw new GatewayError(response.status, await response.text())
  }

  // Handle empty responses
  const text = await response.text()
  if (!text) {
    return {} as T
  }

  return JSON.parse(text)
}

/**
 * Gateway client with API key authentication
 * Use for server-to-server communication only
 */
export async function gatewayFetchWithApiKey<T>(
  path: string,
  options: GatewayFetchOptions = {}
): Promise<T> {
  const config = getConfig()

  if (!config.HEALTHTALK_API_KEY) {
    throw new Error('HEALTHTALK_API_KEY is required for API key authentication')
  }

  const url = `${config.HEALTHTALK_GATEWAY_URL}${path}`

  const response = await fetch(url, {
    ...options,
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': config.HEALTHTALK_TENANT_ID,
      'X-Api-Key': config.HEALTHTALK_API_KEY,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    throw new GatewayError(response.status, await response.text())
  }

  const text = await response.text()
  if (!text) {
    return {} as T
  }

  return JSON.parse(text)
}
