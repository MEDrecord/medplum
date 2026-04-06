import { NextRequest, NextResponse } from "next/server";
import { validateTwilioSignature } from "@/lib/twilio";
import { updateTaskStatus } from "@/lib/medplum";
import { getRedis } from "@/lib/redis";

/**
 * Twilio Status Callback Webhook
 * 
 * Called when message status changes (queued, sent, delivered, read, failed, etc.)
 * https://www.twilio.com/docs/messaging/guides/webhook-request
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature validation
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    // Validate Twilio signature
    const signature = request.headers.get("x-twilio-signature") || "";
    const url = request.url;

    if (!validateTwilioSignature(signature, url, params)) {
      console.error("[v0] Invalid Twilio signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const {
      MessageSid,
      MessageStatus,
      To,
      ErrorCode,
      ErrorMessage,
    } = params;

    console.log(`[v0] Twilio status update: ${MessageSid} -> ${MessageStatus}`);

    // Store the status in Redis for tracking
    const redis = getRedis();
    await redis.hset(`message:${MessageSid}`, {
      status: MessageStatus,
      updatedAt: new Date().toISOString(),
      to: To,
      ...(ErrorCode && { errorCode: ErrorCode }),
      ...(ErrorMessage && { errorMessage: ErrorMessage }),
    });

    // Get the taskId associated with this message
    const taskId = await redis.get<string>(`message:${MessageSid}:taskId`);

    if (taskId) {
      // Update task status based on message status
      switch (MessageStatus) {
        case "delivered":
          await updateTaskStatus(taskId, "in-progress", "message-delivered");
          break;
        case "read":
          await updateTaskStatus(taskId, "in-progress", "message-read");
          break;
        case "failed":
        case "undelivered":
          console.error(`[v0] Message failed: ${ErrorCode} - ${ErrorMessage}`);
          await updateTaskStatus(taskId, "failed", "message-failed");
          break;
      }
    }

    // Return empty TwiML response
    return new NextResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("[v0] Twilio status webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
