import { NextResponse } from "next/server";

export async function GET() {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "communication-gateway",
    version: "1.0.0",
    checks: {
      twilio: !!process.env.TWILIO_ACCOUNT_SID,
      medplum: !!process.env.MEDPLUM_BASE_URL,
      redis: !!process.env.UPSTASH_REDIS_REST_URL,
      webhookSecret: !!process.env.WEBHOOK_SECRET,
      magicLinkSecret: !!process.env.MAGIC_LINK_SECRET,
    },
  };

  const allHealthy = Object.values(health.checks).every(Boolean);

  return NextResponse.json(health, {
    status: allHealthy ? 200 : 503,
  });
}
