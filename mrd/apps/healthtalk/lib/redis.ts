import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

export function getRedis(): Redis {
  if (redisClient) {
    return redisClient;
  }

  // Support both naming conventions
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("Missing Upstash Redis configuration (KV_REST_API_URL/TOKEN or UPSTASH_REDIS_REST_URL/TOKEN)");
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

// Session management for WhatsApp conversations
export interface WhatsAppSession {
  taskId: string;
  patientId: string;
  questionnaireId: string;
  currentItemIndex: number;
  answers: Record<string, unknown>;
  startedAt: string;
  lastMessageAt: string;
}

const SESSION_PREFIX = "whatsapp:session:";
const SESSION_TTL = 60 * 60 * 24; // 24 hours

export async function getSession(phoneNumber: string): Promise<WhatsAppSession | null> {
  const redis = getRedis();
  const key = `${SESSION_PREFIX}${phoneNumber}`;
  const session = await redis.get<WhatsAppSession>(key);
  return session;
}

export async function setSession(
  phoneNumber: string,
  session: WhatsAppSession
): Promise<void> {
  const redis = getRedis();
  const key = `${SESSION_PREFIX}${phoneNumber}`;
  await redis.set(key, session, { ex: SESSION_TTL });
}

export async function deleteSession(phoneNumber: string): Promise<void> {
  const redis = getRedis();
  const key = `${SESSION_PREFIX}${phoneNumber}`;
  await redis.del(key);
}

export async function updateSessionAnswer(
  phoneNumber: string,
  itemLinkId: string,
  answer: unknown
): Promise<WhatsAppSession | null> {
  const session = await getSession(phoneNumber);
  if (!session) {
    return null;
  }

  session.answers[itemLinkId] = answer;
  session.currentItemIndex += 1;
  session.lastMessageAt = new Date().toISOString();

  await setSession(phoneNumber, session);
  return session;
}

// Message deduplication
const MESSAGE_PREFIX = "whatsapp:msg:";
const MESSAGE_TTL = 60 * 60; // 1 hour

export async function isMessageProcessed(messageSid: string): Promise<boolean> {
  const redis = getRedis();
  const key = `${MESSAGE_PREFIX}${messageSid}`;
  const exists = await redis.exists(key);
  return exists === 1;
}

export async function markMessageProcessed(messageSid: string): Promise<void> {
  const redis = getRedis();
  const key = `${MESSAGE_PREFIX}${messageSid}`;
  await redis.set(key, "1", { ex: MESSAGE_TTL });
}
